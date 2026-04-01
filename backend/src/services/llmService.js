const env = require("../config/env");

const fetchGemini = async (model, action, body) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.httpTimeoutMs);

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:${action}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": env.geminiApiKey,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini request failed (${response.status}): ${errorText}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
};

const extractJsonText = (value) => {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(extractJsonText).join(" ");
  }

  if (typeof value === "object") {
    if (value.output_text) {
      return value.output_text;
    }

    if (value.text?.value) {
      return value.text.value;
    }

    if (value.content) {
      return extractJsonText(value.content);
    }

    if (value.output) {
      return extractJsonText(value.output);
    }

    const invertedKeys = Object.keys(value);
    const isInvertedIndex = invertedKeys.every((key) => Array.isArray(value[key]));

    if (isInvertedIndex) {
      const positions = [];
      Object.entries(value).forEach(([term, indices]) => {
        indices.forEach((index) => {
          positions[index] = term;
        });
      });
      return positions.filter(Boolean).join(" ");
    }
  }

  return "";
};

const embedTexts = async (texts) => {
  if (!env.geminiApiKey) {
    throw new Error("Embedding model is not configured.");
  }

  const results = await Promise.all(
    texts.map((text, index) =>
      fetchGemini(env.geminiEmbeddingModel, "embedContent", {
        model: `models/${env.geminiEmbeddingModel}`,
        content: {
          parts: [{ text }],
        },
        taskType: index === 0 ? "RETRIEVAL_QUERY" : "RETRIEVAL_DOCUMENT",
      })
    )
  );

  return results.map((result) => result.embedding?.values || []);
};

const cosineSimilarity = (left = [], right = []) => {
  if (!left.length || !right.length || left.length !== right.length) {
    return 0;
  }

  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftMagnitude += left[index] ** 2;
    rightMagnitude += right[index] ** 2;
  }

  if (!leftMagnitude || !rightMagnitude) {
    return 0;
  }

  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
};

const generateStructuredReview = async ({ payload, analysis, retrieval, heuristicReview }) => {
  const literatureContext = retrieval.papers.slice(0, 6).map((paper) => ({
    title: paper.title,
    year: paper.year,
    source: paper.source,
    abstract: paper.abstract,
    url: paper.url,
  }));

  const standardsContext = retrieval.standards.map((standard) => ({
    title: standard.title,
    summary: standard.summary,
    url: standard.url,
  }));

  const prompt = {
    task: "Review the manuscript draft and produce structured, actionable pre-submission feedback.",
    desiredSchema: {
      executiveSummary: "string",
      readinessScore: "number between 0 and 100",
      verdict: "string",
      sectionFeedback: [{ section: "string", present: "boolean", feedback: "string" }],
      majorConcerns: [{ title: "string", severity: "high|medium|low", rationale: "string" }],
      improvementActions: ["string"],
      questionsForAuthor: ["string"],
      evidence: {
        standardsConsidered: [{ title: "string", url: "string" }],
        relatedLiterature: [{ title: "string", source: "string", year: "number|null", url: "string" }],
      },
      meta: { generatedBy: "string", generatedAt: "ISO timestamp string" },
    },
    manuscript: {
      title: payload.title,
      abstract: payload.abstract || "",
      manuscript: payload.manuscript || "",
      discipline: payload.discipline || "general",
      targetVenue: payload.targetVenue || "",
    },
    analysis,
    retrievedStandards: standardsContext,
    retrievedLiterature: literatureContext,
    baselineHeuristicReview: heuristicReview,
  };

  const result = await fetchGemini(env.geminiModel, "generateContent", {
    system_instruction: {
      parts: [
        {
          text: "You are a rigorous pre-submission paper reviewer. Return only valid JSON with the requested schema. Ground every criticism in the provided manuscript analysis and retrieved standards and literature.",
        },
      ],
    },
    contents: [
      {
        role: "user",
        parts: [
          {
            text: JSON.stringify(prompt),
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
    },
  });

  const content =
    result.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim() || "";

  if (!content) {
    throw new Error("Gemini response did not contain review content.");
  }

  const parsed = JSON.parse(content);
  parsed.meta = {
    ...(parsed.meta || {}),
    generatedBy: "gemini-rag-review-engine",
    generatedAt: new Date().toISOString(),
  };

  return parsed;
};

module.exports = {
  embedTexts,
  cosineSimilarity,
  extractJsonText,
  generateStructuredReview,
};
