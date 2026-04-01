const mongoose = require("mongoose");

const findingSchema = new mongoose.Schema(
  {
    dimensionName: String,
    severity: {
      type: String,
      enum: ["critical", "moderate", "minor"],
    },
    title: String,
    description: String,
    suggestion: String,
    affectedSection: String,
    evidence: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    confidence: Number,
  },
  { _id: false }
);

const reviewReportSchema = new mongoose.Schema(
  {
    paperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Paper",
      required: true,
      unique: true,
      index: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ReviewJob",
      required: true,
      index: true,
    },
    overallScore: Number,
    readinessLevel: String,
    dimensionScores: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    findings: {
      type: [findingSchema],
      default: [],
    },
    literatureGaps: {
      type: [String],
      default: [],
    },
    missingSections: {
      type: [String],
      default: [],
    },
    prioritizedRecommendations: {
      type: [String],
      default: [],
    },
    retrievedSources: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    rawReview: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

module.exports = mongoose.model("ReviewReport", reviewReportSchema);
