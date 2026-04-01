const mongoose = require("mongoose");

const reviewJobSchema = new mongoose.Schema(
  {
    paperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Paper",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["queued", "parsing", "retrieving", "reviewing", "aggregating", "completed", "failed"],
      default: "queued",
    },
    progress: {
      type: Number,
      default: 0,
    },
    currentStage: {
      type: String,
      default: "Queued for processing",
    },
    errorMessage: {
      type: String,
      default: null,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: false,
  }
);

module.exports = mongoose.model("ReviewJob", reviewJobSchema);
