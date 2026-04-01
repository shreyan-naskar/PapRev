const express = require("express");
const path = require("path");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const env = require("./config/env");
const paperRouter = require("./routes/paperRoutes");
const jobRouter = require("./routes/jobRoutes");
const reportRouter = require("./routes/reportRoutes");
const reviewRouter = require("./routes/reviewRoutes");
const webhookRouter = require("./routes/webhookRoutes");
const internalRouter = require("./routes/internalRoutes");
const { getCapabilities } = require("./controllers/systemController");
const { globalErrorHandler, notFoundHandler } = require("./middleware/errorMiddleware");
const { uploadsDirectory } = require("./services/jobWorkflowService");

const app = express();
const frontendDistPath = path.resolve(__dirname, "../../frontend/dist");
const frontendEntrypoint = path.join(frontendDistPath, "index.html");

app.use(
  cors({
    origin: env.corsOrigin === "*" ? true : env.corsOrigin,
    credentials: env.corsOrigin !== "*",
  })
);
app.use(helmet());

if (env.nodeEnv !== "production") {
  app.use(morgan("dev"));
}

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(cookieParser());
app.use(express.static(frontendDistPath));
app.use("/uploads", express.static(uploadsDirectory));

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "paprev-backend",
    timestamp: new Date().toISOString(),
    providers: {
      llm: env.geminiApiKey ? "configured" : "heuristic-fallback",
      literatureSearch: "openalex-crossref",
      ragService: env.ragServiceUrl,
      mongo: env.mongoUri,
    },
  });
});

app.get("/api/v1/capabilities", getCapabilities);
app.use("/api/papers", paperRouter);
app.use("/api/jobs", jobRouter);
app.use("/api/reports", reportRouter);
app.use("/api/webhook", webhookRouter);
app.use("/api/internal", internalRouter);
app.use("/api/v1/reviews", reviewRouter);

app.get("/", (req, res) => {
  res.sendFile(frontendEntrypoint);
});

app.get(/^\/(?!api\/).*/, (req, res) => {
  res.sendFile(frontendEntrypoint);
});

app.use(notFoundHandler);
app.use(globalErrorHandler);

module.exports = app;
