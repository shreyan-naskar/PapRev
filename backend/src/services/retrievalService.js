const env = require("../config/env");
const { curatedStandards } = require("../data/submissionStandards");
const { embedTexts, cosineSimilarity, extractJsonText } = require("./llmService");
const { tokenize } = require("./manuscriptAnalysisService");

const fetchJson = async (url) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.httpTimeoutMs);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "PapRev/1.0",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
};

const buildQuery = ({ payload, analysis }) => {
  const terms = [
    payload.title,
    payload.discipline,
    payload.targetVenue,
    analysis.sectionPresence.methodology ? "methodology" : "research design",
    analysis.methodologySignals.presence.dataset ? "dataset evaluation" : "experimental validation",
  ].filter(Boolean);

  return terms.join(" ");
};

const normalizeOpenAlex = (item) => ({
  id: item.id,
  title: item.display_name,
  year: item.publication_year,
  source: item.primary_location?.source?.display_name || "OpenAlex",
  url: item.primary_location?.landing_page_url || item.id,
  abstract: extractJsonText(item.abstract_inverted_index),
  citations: item.cited_by_count || 0,
  type: "literature",
});

const normalizeCrossref = (item) => ({
  id: item.DOI || item.URL,
  title: Array.isArray(item.title) ? item.title[0] : "Untitled",
  year: item.issued?.["date-parts"]?.[0]?.[0] || null,
  source: Array.isArray(item["container-title"]) ? item["container-title"][0] : "Crossref",
  url: item.URL,
  abstract: item.abstract ? item.abstract.replace(/<[^>]+>/g, " ") : "",
  citations: item["is-referenced-by-count"] || 0,
  type: "literature",
});

const rankByTokenOverlap = (query, items) => {
  const queryTerms = new Set(tokenize(query));

  return items
    .map((item) => {
      const itemTerms = tokenize(`${item.title} ${item.abstract} ${item.source}`);
      const overlap = itemTerms.reduce((score, term) => score + (queryTerms.has(term) ? 1 : 0), 0);
      return { ...item, score: overlap + Math.min(item.citations || 0, 200) / 100 };
    })
    .sort((left, right) => right.score - left.score);
};

const rankWithEmbeddings = async (query, items) => {
  if (!env.geminiApiKey || items.length === 0) {
    return rankByTokenOverlap(query, items);
  }

  try {
    const embeddings = await embedTexts([query, ...items.map((item) => `${item.title}\n${item.abstract}`)]);
    const [queryEmbedding, ...itemEmbeddings] = embeddings;

    return items
      .map((item, index) => ({
        ...item,
        score: cosineSimilarity(queryEmbedding, itemEmbeddings[index]) + Math.min(item.citations || 0, 100) / 500,
      }))
      .sort((left, right) => right.score - left.score);
  } catch (error) {
    return rankByTokenOverlap(query, items);
  }
};

const retrieveLiterature = async (query) => {
  const [openAlexResult, crossrefResult] = await Promise.allSettled([
    fetchJson(`https://api.openalex.org/works?search=${encodeURIComponent(query)}&per-page=5`),
    fetchJson(`https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=5`),
  ]);

  const openAlexItems =
    openAlexResult.status === "fulfilled"
      ? (openAlexResult.value.results || []).map(normalizeOpenAlex)
      : [];

  const crossrefItems =
    crossrefResult.status === "fulfilled"
      ? (crossrefResult.value.message?.items || []).map(normalizeCrossref)
      : [];

  return [...openAlexItems, ...crossrefItems].filter((item) => item.title && item.url);
};

const selectStandards = ({ payload, analysis }) => {
  const discipline = (payload.discipline || "general").toLowerCase();

  return curatedStandards.filter((standard) => {
    if (standard.disciplines.includes("all") || standard.disciplines.includes(discipline)) {
      return true;
    }

    if (analysis.methodologySignals.presence.ethics && standard.tags.includes("ethics")) {
      return true;
    }

    return false;
  });
};

const retrieveReviewContext = async ({ payload, analysis, maxResults }) => {
  const query = buildQuery({ payload, analysis });
  const standards = selectStandards({ payload, analysis });
  const literature = await retrieveLiterature(query);
  const rankedPapers = await rankWithEmbeddings(query, literature);

  return {
    query,
    standards,
    papers: rankedPapers.slice(0, maxResults),
  };
};

module.exports = {
  retrieveReviewContext,
};
