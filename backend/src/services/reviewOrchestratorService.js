const env = require("../config/env");
const { analyzeManuscript } = require("./manuscriptAnalysisService");
const { retrieveReviewContext } = require("./retrievalService");
const { buildHeuristicReview } = require("./reviewHeuristicsService");
const { generateStructuredReview } = require("./llmService");

const reviewPaper = async (payload) => {
  const analysis = analyzeManuscript(payload);
  const retrieval = await retrieveReviewContext({
    payload,
    analysis,
    maxResults: env.maxRetrievedPapers,
  });

  const heuristicReview = buildHeuristicReview({
    payload,
    analysis,
    retrieval,
  });

  let finalReview = heuristicReview;
  let generationMode = "heuristic";

  if (env.geminiApiKey) {
    try {
      finalReview = await generateStructuredReview({
        payload,
        analysis,
        retrieval,
        heuristicReview,
      });
      generationMode = "gemini-rag";
    } catch (error) {
      finalReview = {
        ...heuristicReview,
        meta: {
          ...heuristicReview.meta,
          llmFallbackReason: error.message,
        },
      };
    }
  }

  return {
    inputSummary: {
      title: payload.title,
      discipline: payload.discipline || "general",
      targetVenue: payload.targetVenue || null,
      reviewMode: generationMode,
    },
    analysis,
    retrieval,
    review: finalReview,
  };
};

module.exports = {
  reviewPaper,
};
