const express = require("express");

const { uploadSinglePdf } = require("../middleware/uploadMiddleware");
const { uploadPaper, createTextReviewJob, listPapers, getPaper } = require("../controllers/paperController");

const router = express.Router();

router.get("/", listPapers);
router.get("/:paperId", getPaper);
router.post("/upload", uploadSinglePdf, uploadPaper);
router.post("/text", createTextReviewJob);

module.exports = router;
