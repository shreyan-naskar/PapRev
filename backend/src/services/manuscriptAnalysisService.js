const SECTION_PATTERNS = {
  abstract: /\babstract\b/i,
  introduction: /\bintroduction\b/i,
  literatureReview: /\b(related work|literature review|background)\b/i,
  methodology: /\b(methodology|methods|materials and methods|approach|experimental setup)\b/i,
  results: /\b(results|findings|evaluation)\b/i,
  discussion: /\bdiscussion\b/i,
  limitations: /\b(limitations|threats to validity)\b/i,
  conclusion: /\b(conclusion|conclusions|future work)\b/i,
  ethics: /\b(ethics|ethical considerations|irb|consent)\b/i,
  reproducibility: /\b(data availability|code availability|reproducibility|artifact availability)\b/i,
  references: /\b(references|bibliography)\b/i,
};

const CHECK_KEYWORDS = {
  researchQuestion: ["research question", "objective", "aim", "hypothesis"],
  dataset: ["dataset", "data source", "corpus", "participants", "sample"],
  baseline: ["baseline", "comparison", "state-of-the-art", "benchmark"],
  ablation: ["ablation", "component analysis", "sensitivity analysis"],
  statistics: ["p-value", "confidence interval", "anova", "t-test", "significant"],
  limitations: ["limitation", "threat", "bias", "constraint"],
  ethics: ["ethics", "consent", "privacy", "fairness", "harm"],
  reproducibility: ["code", "github", "repository", "seed", "hyperparameter", "appendix"],
};

const tokenize = (text) =>
  (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

const countMatches = (text, phrases) =>
  phrases.reduce((count, phrase) => count + (text.toLowerCase().includes(phrase.toLowerCase()) ? 1 : 0), 0);

const extractSections = (manuscript) => {
  const lines = manuscript
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const headings = lines.filter((line) => {
    const shortEnough = line.length <= 90;
    const headingShape =
      /^[0-9ivx.\s-]*[A-Z][A-Za-z0-9\s\-:&/()]{2,}$/.test(line) ||
      /^[0-9]+\.\s+/.test(line);

    return shortEnough && headingShape;
  });

  const sectionPresence = Object.fromEntries(
    Object.entries(SECTION_PATTERNS).map(([section, pattern]) => [
      section,
      headings.some((heading) => pattern.test(heading)) || pattern.test(manuscript),
    ])
  );

  return {
    headings,
    sectionPresence,
  };
};

const buildWritingSignals = (text) => {
  const sentences = text.split(/[.!?]+/).map((sentence) => sentence.trim()).filter(Boolean);
  const words = tokenize(text);
  const averageSentenceLength = sentences.length
    ? Number((words.length / sentences.length).toFixed(1))
    : 0;

  const longSentences = sentences.filter((sentence) => tokenize(sentence).length > 35).length;
  const paragraphBlocks = text.split(/\n\s*\n/).filter((block) => block.trim());
  const oversizedParagraphs = paragraphBlocks.filter((block) => tokenize(block).length > 180).length;

  return {
    wordCount: words.length,
    sentenceCount: sentences.length,
    averageSentenceLength,
    longSentenceCount: longSentences,
    oversizedParagraphCount: oversizedParagraphs,
    readabilityFlags: [
      ...(averageSentenceLength > 28 ? ["Sentences are likely too dense for easy review."] : []),
      ...(longSentences >= 3 ? ["Several sentences exceed 35 words and may hide key claims."] : []),
      ...(oversizedParagraphs >= 2 ? ["Large paragraph blocks may make the narrative harder to scan."] : []),
    ],
  };
};

const buildMethodologySignals = (text) => {
  const lowerText = text.toLowerCase();
  const presence = Object.fromEntries(
    Object.entries(CHECK_KEYWORDS).map(([key, phrases]) => [key, countMatches(lowerText, phrases) > 0])
  );

  return {
    presence,
    missingSignals: Object.entries(presence)
      .filter(([, exists]) => !exists)
      .map(([key]) => key),
  };
};

const analyzeManuscript = (payload) => {
  const manuscript = payload.manuscript?.trim() || payload.abstract?.trim() || "";
  const { headings, sectionPresence } = extractSections(manuscript);
  const writingSignals = buildWritingSignals(manuscript);
  const methodologySignals = buildMethodologySignals(manuscript);

  const missingCoreSections = ["introduction", "methodology", "results", "conclusion", "references"].filter(
    (section) => !sectionPresence[section]
  );

  return {
    detectedHeadings: headings,
    sectionPresence,
    missingCoreSections,
    methodologySignals,
    writingSignals,
  };
};

module.exports = {
  analyzeManuscript,
  tokenize,
};
