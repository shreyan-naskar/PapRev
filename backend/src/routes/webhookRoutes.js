const express = require("express");

const { acceptCompletedReview } = require("../controllers/webhookController");

const router = express.Router();

router.post("/review-complete", acceptCompletedReview);

module.exports = router;
