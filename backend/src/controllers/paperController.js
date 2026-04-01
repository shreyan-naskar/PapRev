const asyncHandler = require("express-async-handler");

const AppError = require("../utils/appError");
const { createTextReviewJob, createUploadReviewJob, listDashboardItems } = require("../services/jobWorkflowService");
const env = require("../config/env");
const Paper = require("../models/Paper");
const { ensureLocalUser } = require("../services/localUserService");

exports.uploadPaper = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError("A PDF file is required in the `paper` form field.", 400);
  }

  const { title, abstract, venue, domain, notes } = req.body;
  const user = await ensureLocalUser();
  const result = await createUploadReviewJob({
    userId: user._id,
    file: req.file,
    title,
    abstract,
    venue,
    domain,
    notes,
    publicBaseUrl: env.publicBaseUrl,
  });

  res.status(202).json({
    success: true,
    data: {
      paperId: result.paper.id,
      jobId: result.job.id,
      status: result.job.status,
      extraction: result.extraction,
    },
  });
});

exports.createTextReviewJob = asyncHandler(async (req, res) => {
  const { title, abstract, manuscript, venue, domain, notes } = req.body;

  if (!title || (!abstract && !manuscript)) {
    throw new AppError("`title` and either `abstract` or `manuscript` are required.", 400);
  }

  const user = await ensureLocalUser();
  const result = await createTextReviewJob({
    userId: user._id,
    title,
    abstract,
    manuscript,
    venue,
    domain,
    notes,
  });

  res.status(202).json({
    success: true,
    data: {
      paperId: result.paper.id,
      jobId: result.job.id,
      status: result.job.status,
    },
  });
});

exports.listPapers = asyncHandler(async (req, res) => {
  const user = await ensureLocalUser();
  res.status(200).json({
    success: true,
    data: await listDashboardItems(user._id),
  });
});

exports.getPaper = asyncHandler(async (req, res) => {
  const paper = await Paper.findById(req.params.paperId).lean();

  if (!paper) {
    throw new AppError("Paper not found.", 404);
  }

  res.status(200).json({
    success: true,
    data: paper,
  });
});
