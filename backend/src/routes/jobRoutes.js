const express = require("express");

const { getJob } = require("../controllers/jobController");

const router = express.Router();

router.get("/:jobId", getJob);

module.exports = router;
