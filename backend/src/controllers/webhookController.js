const asyncHandler = require("express-async-handler");
const env = require("../config/env");
const AppError = require("../utils/appError");
const {
  recordProgressUpdate,
  recordCompletedReview,
  recordFailedReview,
  runLocalFallbackReview,
} = require("../services/jobWorkflowService");

const verifyInternalSecret = (req) => {
  const secret = req.headers["x-internal-secret"];

  if (secret !== env.internalWebhookSecret) {
    throw new AppError("Invalid internal webhook secret.", 401);
  }
};

exports.acceptProgress = asyncHandler(async (req, res) => {
  verifyInternalSecret(req);

  const job = await recordProgressUpdate(req.body);

  res.status(202).json({
    success: true,
    data: {
      received: true,
      message: "Progress update accepted.",
      job,
    },
  });
});

exports.acceptCompletedReview = asyncHandler(async (req, res) => {
  verifyInternalSecret(req);

  if (req.body.status === "failed") {
    try {
      await runLocalFallbackReview({
        reviewJobId: req.body.reviewJobId,
        paperId: req.body.paperId,
        failureReason: req.body.errorMessage || "RAG service reported failure.",
      });
    } catch (error) {
      await recordFailedReview({
        ...req.body,
        errorMessage: `${req.body.errorMessage || "RAG service reported failure."} Fallback review also failed: ${error.message}`,
      });
    }
  } else {
    await recordCompletedReview(req.body);
  }

  res.status(202).json({
    success: true,
    data: {
      received: true,
      message: "Review completion update accepted.",
    },
  });
});
