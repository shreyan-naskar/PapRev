const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");
const xssClean = require("xss-clean");

const env = require("./config/env");
const reviewRouter = require("./routes/reviewRoutes");
const { globalErrorHandler, notFoundHandler } = require("./middleware/errorMiddleware");

const app = express();

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
app.use(mongoSanitize());
app.use(xssClean());
app.use(hpp());

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "paprev-backend",
    timestamp: new Date().toISOString(),
    providers: {
      llm: env.geminiApiKey ? "configured" : "heuristic-fallback",
      literatureSearch: "openalex-crossref",
    },
  });
});

app.use("/api/v1/reviews", reviewRouter);

app.use(notFoundHandler);
app.use(globalErrorHandler);

module.exports = app;
