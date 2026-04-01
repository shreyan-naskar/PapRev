const fs = require("fs/promises");
const path = require("path");

const Paper = require("../models/Paper");
const ReviewJob = require("../models/ReviewJob");
const ReviewReport = require("../models/ReviewReport");
const env = require("../config/env");
const { submitReviewJobToRag } = require("./ragService");
const { reviewPaper } = require("./reviewOrchestratorService");
const { extractPdfText } = require("./pdfExtractionService");
const { emitJobCompleted, emitJobFailed, emitJobUpdate } = require("../socket/socketService");

const uploadsDirectory = path.resolve(__dirname, "../../uploads");

const ensureUploadsDirectory = async () => {
  await fs.mkdir(uploadsDirectory, { recursive: true });
};

const buildWebhookUrl = (routePath) => `${env.publicBaseUrl}${routePath}`;

const buildDimensionScores = (review) => {
  const baseScore = Number(((review.readinessScore || review.overallScore * 10 || 0) / 10).toFixed(1));

  return {
    completeness: baseScore,
    literature: Math.max(0, Number((baseScore - 0.4).toFixed(1))),
    methodology: Math.max(0, Number((baseScore - 0.2).toFixed(1))),
    novelty: Math.max(0, Number((baseScore - 0.5).toFixed(1))),
    statistics: Math.max(0, Number((baseScore - 0.8).toFixed(1))),
    reproducibility: Math.max(0, Number((baseScore - 0.6).toFixed(1))),
    writing: Math.max(0, Number((baseScore - 0.1).toFixed(1))),
    ethics: Math.max(0, Number((baseScore - 0.3).toFixed(1))),
  };
};

const buildReadinessLevel = (readinessScore) => {
  if (readinessScore >= 85) {
    return "ready";
  }

  if (readinessScore >= 70) {
    return "minor-revision";
  }

  if (readinessScore >= 50) {
    return "major-revision";
  }

  return "not-ready";
};

const normalizeFindings = (review) =>
  (review.findings || review.majorConcerns || []).map((item, index) => ({
    dimensionName: item.dimensionName || (index % 2 === 0 ? "methodology" : "completeness"),
    severity:
      item.severity === "high"
        ? "critical"
        : item.severity === "medium"
          ? "moderate"
          : item.severity || "minor",
    title: item.title,
    description: item.description || item.rationale || "",
    suggestion: item.suggestion || review.improvementActions?.[index] || "Revise this section before submission.",
    affectedSection: item.affectedSection || "General manuscript",
    evidence: item.evidence || review.evidence?.relatedLiterature?.slice(0, 2) || [],
    confidence: item.confidence || 0.7,
  }));

const buildFallbackPayloadForPaper = async (paper) => {
  let manuscript = paper.draftText || "";

  if (!manuscript && paper.storagePath) {
    const pdfBuffer = await fs.readFile(paper.storagePath);
    const extraction = await extractPdfText(pdfBuffer);
    manuscript = extraction.text;
  }

  return {
    title: paper.title || paper.originalFilename,
    abstract: paper.abstract || "",
    manuscript,
    targetVenue: paper.venue || null,
    discipline: paper.domain || "general",
  };
};

const runLocalFallbackReview = async ({ reviewJobId, paperId, failureReason }) => {
  const [reviewJob, paper] = await Promise.all([
    ReviewJob.findById(reviewJobId),
    Paper.findById(paperId),
  ]);

  if (!reviewJob || !paper) {
    throw new Error("Fallback review could not load the paper/job.");
  }

  await ReviewJob.findByIdAndUpdate(reviewJob._id, {
    status: "reviewing",
    progress: 78,
    currentStage: "Falling back to local heuristic review",
    errorMessage: failureReason || null,
  });

  emitJobUpdate(String(reviewJob._id), {
    status: "reviewing",
    progress: 78,
    currentStage: "Falling back to local heuristic review",
    errorMessage: failureReason || null,
  });

  const payload = await buildFallbackPayloadForPaper(paper);
  const report = await reviewPaper(payload);

  if (failureReason && report.review?.meta) {
    report.review.meta.ragFallbackReason = failureReason;
  }

  await recordCompletedReview({
    reviewJobId: String(reviewJob._id),
    paperId: String(paper._id),
    report,
  });
};

const dispatchReviewJob = async ({ reviewJobId, paperId }) => {
  try {
    const [reviewJob, paper] = await Promise.all([
      ReviewJob.findById(reviewJobId),
      Paper.findById(paperId),
    ]);

    if (!reviewJob || !paper) {
      throw new Error("Paper review job could not be loaded for processing.");
    }

    await Promise.all([
      Paper.findByIdAndUpdate(paper._id, { status: "processing" }),
      ReviewJob.findByIdAndUpdate(reviewJob._id, {
        status: "parsing",
        progress: 10,
        currentStage: "Dispatching review to RAG service",
      }),
    ]);

    emitJobUpdate(String(reviewJob._id), {
      status: "parsing",
      progress: 10,
      currentStage: "Dispatching review to RAG service",
    });

    await submitReviewJobToRag({
      reviewJobId: String(reviewJob._id),
      paperId: String(paper._id),
      userId: String(reviewJob.userId),
      paper: {
        id: String(paper._id),
        title: paper.title || paper.originalFilename,
        originalFilename: paper.originalFilename,
        publicUrl: paper.publicUrl,
        storagePath: paper.storagePath,
        venue: paper.venue,
        domain: paper.domain,
        notes: paper.notes,
      },
      manuscript: paper.draftText || "",
      abstract: paper.abstract || "",
      webhook: {
        progressUrl: buildWebhookUrl("/api/internal/progress"),
        completeUrl: buildWebhookUrl("/api/webhook/review-complete"),
        secret: env.internalWebhookSecret,
      },
    });
  } catch (error) {
    try {
      await runLocalFallbackReview({
        reviewJobId,
        paperId,
        failureReason: error.message,
      });
    } catch (fallbackError) {
      await recordFailedReview({
        reviewJobId,
        paperId,
        errorMessage: `${error.message}. Fallback review also failed: ${fallbackError.message}`,
      });
    }
  }
};

const createTextReviewJob = async ({ userId, title, abstract, manuscript, venue, domain, notes }) => {
  const paper = await Paper.create({
    userId,
    title,
    originalFilename: `${title}.txt`,
    venue: venue || null,
    domain: domain || "general",
    notes: notes || "",
    abstract: abstract || "",
    draftText: manuscript || "",
    status: "queued",
  });

  const reviewJob = await ReviewJob.create({
    paperId: paper._id,
    userId,
    status: "queued",
    progress: 0,
    currentStage: "Queued for processing",
  });

  emitJobUpdate(String(reviewJob._id), {
    status: "queued",
    progress: 5,
    currentStage: "Queued for processing",
  });

  setImmediate(() => {
    dispatchReviewJob({
      reviewJobId: String(reviewJob._id),
      paperId: String(paper._id),
    });
  });

  return {
    paper,
    job: reviewJob,
  };
};

const createUploadReviewJob = async ({ userId, file, title, abstract, venue, domain, notes, publicBaseUrl }) => {
  await ensureUploadsDirectory();

  const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;
  const storagePath = path.join(uploadsDirectory, fileName);
  await fs.writeFile(storagePath, file.buffer);

  const paper = await Paper.create({
    userId,
    title: title || path.parse(file.originalname).name,
    originalFilename: file.originalname,
    storagePath,
    publicUrl: `${publicBaseUrl}/uploads/${fileName}`,
    venue: venue || null,
    domain: domain || "general",
    notes: notes || "",
    abstract: abstract || "",
    status: "queued",
  });

  const reviewJob = await ReviewJob.create({
    paperId: paper._id,
    userId,
    status: "queued",
    progress: 0,
    currentStage: "Queued for processing",
  });

  emitJobUpdate(String(reviewJob._id), {
    status: "queued",
    progress: 5,
    currentStage: "Queued for processing",
  });

  setImmediate(() => {
    dispatchReviewJob({
      reviewJobId: String(reviewJob._id),
      paperId: String(paper._id),
    });
  });

  return {
    paper,
    job: reviewJob,
  };
};

const recordProgressUpdate = async ({ reviewJobId, status, progress, currentStage, errorMessage }) => {
  const job = await ReviewJob.findByIdAndUpdate(
    reviewJobId,
    {
      ...(status ? { status } : {}),
      ...(typeof progress === "number" ? { progress } : {}),
      ...(currentStage ? { currentStage } : {}),
      ...(errorMessage ? { errorMessage } : {}),
    },
    { new: true }
  );

  if (!job) {
    return null;
  }

  emitJobUpdate(String(job._id), {
    status: job.status,
    progress: job.progress,
    currentStage: job.currentStage,
    errorMessage: job.errorMessage,
  });

  return job;
};

const recordCompletedReview = async ({ reviewJobId, paperId, report }) => {
  const reviewJob = await ReviewJob.findByIdAndUpdate(
    reviewJobId,
    {
      status: "completed",
      progress: 100,
      currentStage: "Complete",
      completedAt: new Date(),
      errorMessage: null,
    },
    { new: true }
  );

  const missingSections = report.analysis?.missingCoreSections || report.missingSections || [];
  const detectedSections = report.analysis?.sectionPresence
    ? Object.entries(report.analysis.sectionPresence)
        .filter(([, present]) => present)
        .map(([section]) => section)
    : [];

  const paper = await Paper.findByIdAndUpdate(
    paperId,
    {
      status: "completed",
      wordCount: report.analysis?.writingSignals?.wordCount || 0,
      detectedSections,
      missingSections,
    },
    { new: true }
  );

  const review = report.review || report;
  const normalizedFindings = normalizeFindings(review);
  const serialized = {
    paperId,
    jobId: reviewJobId,
    overallScore: Number(((review.readinessScore || 0) / 10).toFixed(1)),
    readinessLevel: buildReadinessLevel(review.readinessScore || 0),
    dimensionScores: buildDimensionScores(review),
    findings: normalizedFindings,
    literatureGaps: (review.questionsForAuthor || []).filter((item) =>
      item.toLowerCase().includes("citation") || item.toLowerCase().includes("literature")
    ),
    missingSections,
    prioritizedRecommendations: review.improvementActions || [],
    retrievedSources: [
      ...(review.evidence?.standardsConsidered || []),
      ...(review.evidence?.relatedLiterature || []),
    ],
    rawReview: report,
    generatedAt: new Date(),
    meta: {
      ...(report.meta || {}),
      ...(review.meta || {}),
      source: report.review ? "rag-service" : "backend-fallback",
      findingCount: normalizedFindings.length,
    },
  };

  const savedReport = await ReviewReport.findOneAndUpdate({ paperId }, serialized, {
    upsert: true,
    new: true,
  });

  emitJobCompleted(String(reviewJob._id), {
    job: {
      id: String(reviewJob._id),
      status: reviewJob.status,
      progress: reviewJob.progress,
      currentStage: reviewJob.currentStage,
    },
    report: savedReport,
    paper,
  });

  return savedReport;
};

const recordFailedReview = async ({ reviewJobId, paperId, errorMessage }) => {
  const reviewJob = await ReviewJob.findByIdAndUpdate(
    reviewJobId,
    {
      status: "failed",
      progress: 100,
      currentStage: "Failed",
      completedAt: new Date(),
      errorMessage,
    },
    { new: true }
  );

  await Paper.findByIdAndUpdate(paperId, { status: "failed" });

  emitJobFailed(String(reviewJob._id), {
    status: reviewJob.status,
    progress: reviewJob.progress,
    currentStage: reviewJob.currentStage,
    errorMessage: reviewJob.errorMessage,
  });

  return reviewJob;
};

const getJobDetails = async (jobId) => ReviewJob.findById(jobId).lean();
const getPaperDetails = async (paperId) => Paper.findById(paperId).lean();
const getReportForPaper = async (paperId) => ReviewReport.findOne({ paperId }).lean();

const listDashboardItems = async (userId) => {
  const papers = await Paper.find({ userId }).sort({ uploadedAt: -1 }).lean();
  const paperIds = papers.map((paper) => paper._id);

  const [jobs, reports] = await Promise.all([
    ReviewJob.find({ userId, paperId: { $in: paperIds } }).lean(),
    ReviewReport.find({ paperId: { $in: paperIds } }).lean(),
  ]);

  return papers.map((paper) => ({
    paper,
    job: jobs.find((item) => String(item.paperId) === String(paper._id)) || null,
    report: reports.find((item) => String(item.paperId) === String(paper._id)) || null,
  }));
};

module.exports = {
  createTextReviewJob,
  createUploadReviewJob,
  dispatchReviewJob,
  runLocalFallbackReview,
  recordProgressUpdate,
  recordCompletedReview,
  recordFailedReview,
  getJobDetails,
  getPaperDetails,
  getReportForPaper,
  listDashboardItems,
  uploadsDirectory,
};
