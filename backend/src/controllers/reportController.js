const asyncHandler = require("express-async-handler");

const AppError = require("../utils/appError");
const { getPaperDetails, getReportForPaper } = require("../services/jobWorkflowService");

exports.getReport = asyncHandler(async (req, res) => {
  const paper = await getPaperDetails(req.params.paperId);

  if (!paper) {
    throw new AppError("Paper not found.", 404);
  }

  const report = await getReportForPaper(req.params.paperId);

  if (!report) {
    throw new AppError("Report is not ready yet.", 404);
  }

  res.status(200).json({
    success: true,
    data: report,
  });
});
