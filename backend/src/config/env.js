const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../../.env"), quiet: true });
module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  corsOrigin: process.env.CORS_ORIGIN || "*",
  publicBaseUrl: process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 5000}`,
  jwtSecret: process.env.JWT_SECRET || "paprev-dev-secret",
  ragServiceUrl: process.env.RAG_SERVICE_URL || "http://localhost:8000",
  internalWebhookSecret: process.env.INTERNAL_WEBHOOK_SECRET || "paprev-internal-secret",
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/paprev",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  geminiEmbeddingModel:
    process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001",
  httpTimeoutMs: Number(process.env.HTTP_TIMEOUT_MS || 12000),
  maxRetrievedPapers: Number(process.env.MAX_RETRIEVED_PAPERS || 8),
};
