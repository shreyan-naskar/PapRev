const asyncHandler = require("express-async-handler");

const AppError = require("../utils/appError");
const { getJobDetails } = require("../services/jobWorkflowService");

exports.getJob = asyncHandler(async (req, res) => {
  const job = await getJobDetails(req.params.jobId);

  if (!job) {
    throw new AppError("Job not found.", 404);
  }

  res.status(200).json({
    success: true,
    data: job,
  });
});
