process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! Shutting down...");
  console.log(err.name, err.message, err.stack);
  process.exit(1);
});

const env = require("./config/env");
const app = require("./app");

const server = app.listen(env.port, () => {
  console.log(`Server running on ${env.port}`);
});

process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! Shutting down...");
  console.log(err.name, err.message, err.stack);
  server.close(() => {
    process.exit(1);
  });
});
