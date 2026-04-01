const mongoose = require("mongoose");

const paperSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    originalFilename: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: null,
    },
    storagePath: {
      type: String,
      default: null,
    },
    publicUrl: {
      type: String,
      default: null,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    venue: {
      type: String,
      default: null,
    },
    domain: {
      type: String,
      default: "general",
    },
    notes: {
      type: String,
      default: "",
    },
    abstract: {
      type: String,
      default: "",
    },
    draftText: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["uploaded", "queued", "processing", "completed", "failed"],
      default: "uploaded",
    },
    wordCount: {
      type: Number,
      default: 0,
    },
    detectedSections: {
      type: [String],
      default: [],
    },
    missingSections: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: false,
  }
);

module.exports = mongoose.model("Paper", paperSchema);
