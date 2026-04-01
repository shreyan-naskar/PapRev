process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! Shutting down...");
  console.log(err.name, err.message, err.stack);
  process.exit(1);
});

const http = require("http");
const { Server } = require("socket.io");

const env = require("./config/env");
const app = require("./app");
const { connectDb } = require("./config/db");
const { initializeSocket } = require("./socket/socketService");
const { registerSocketHandlers } = require("./socket/registerSocketHandlers");

const startServer = async () => {
  await connectDb();

  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: env.corsOrigin === "*" ? true : env.corsOrigin,
      credentials: env.corsOrigin !== "*",
    },
  });

  initializeSocket(io);
  registerSocketHandlers(io);

  httpServer.listen(env.port, () => {
    console.log(`Server running on ${env.port}`);
  });

  return httpServer;
};

let server;

startServer()
  .then((httpServer) => {
    server = httpServer;
  })
  .catch((error) => {
    console.log("SERVER STARTUP FAILED");
    console.log(error.name, error.message, error.stack);
    process.exit(1);
  });

process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! Shutting down...");
  console.log(err.name, err.message, err.stack);
  server.close(() => {
    process.exit(1);
  });
});
