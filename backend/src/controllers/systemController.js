const asyncHandler = require("express-async-handler");

const env = require("../config/env");

exports.getCapabilities = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      ingestion: ["raw text", "abstract-only draft", "pdf-upload"],
      retrievalProviders: ["OpenAlex", "Crossref", "curated submission standards"],
      llmReview: Boolean(env.geminiApiKey),
      fallbackReview: true,
      supportedDisciplines: [
        "computer-science",
        "machine-learning",
        "healthcare",
        "social-sciences",
        "general",
      ],
      architecture: {
        frontend: "react-vite",
        backend: "express-mongoose-socketio",
        ragService: "fastapi-webhook-worker",
      },
    },
  });
});
