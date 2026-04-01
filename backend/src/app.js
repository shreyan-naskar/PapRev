const express = require("express");

const app = express();

app.use(express.json({ limit: "10kb" })); // body parser
app.use(express.urlencoded({ extended: true, limit: "10kb" })); // URL-encoded parser (for forms)

// app.use()
module.exports = app;
