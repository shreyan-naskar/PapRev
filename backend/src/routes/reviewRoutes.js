const express = require("express");

const { createReview, createReviewFromUpload, getCapabilities } = require("../controllers/reviewController");
const { uploadSinglePdf } = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/capabilities", getCapabilities);
router.post("/upload", uploadSinglePdf, createReviewFromUpload);
router.post("/", createReview);

module.exports = router;
