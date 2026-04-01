const asyncHandler = require("express-async-handler");
const path = require("path");

const AppError = require("../utils/appError");
const env = require("../config/env");
const { reviewPaper } = require("../services/reviewOrchestratorService");
const { extractPdfText } = require("../services/pdfExtractionService");

const validatePayload = (payload) => {
  const manuscript = payload.manuscript?.trim();
  const abstract = payload.abstract?.trim();

  if (!payload.title?.trim()) {
    throw new AppError("`title` is required.", 400);
  }

  if (!manuscript && !abstract) {
    throw new AppError("Provide either `manuscript` or `abstract` for analysis.", 400);
  }
};

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
    },
  });
});

exports.createReviewFromUpload = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError("A PDF file is required in the `paper` form field.", 400);
  }

  const extraction = await extractPdfText(req.file.buffer);
  const inferredTitle = path.parse(req.file.originalname).name;

  const payload = {
    ...req.body,
    title: req.body.title?.trim() || inferredTitle,
    manuscript: req.body.manuscript?.trim() || extraction.text,
  };

  validatePayload(payload);

  const result = await reviewPaper(payload);

  res.status(200).json({
    success: true,
    data: {
      ...result,
      upload: {
        originalFileName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      },
      extraction: {
        textLength: extraction.text.length,
        wordCount: extraction.wordCount,
        pageCount: extraction.pageCount,
        info: extraction.info,
      },
    },
  });
});

exports.createReview = asyncHandler(async (req, res) => {
  validatePayload(req.body);

  const result = await reviewPaper(req.body);

  res.status(200).json({
    success: true,
    data: result,
  });
});
