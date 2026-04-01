const express = require("express");

const { acceptProgress } = require("../controllers/webhookController");

const router = express.Router();

router.post("/progress", acceptProgress);

module.exports = router;
