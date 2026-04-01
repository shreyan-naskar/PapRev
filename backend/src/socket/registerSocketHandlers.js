const jwt = require("jsonwebtoken");

const env = require("../config/env");

const registerSocketHandlers = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      next();
      return;
    }

    try {
      socket.user = jwt.verify(token, env.jwtSecret);
      next();
    } catch (error) {
      next(new Error("Invalid socket token."));
    }
  });

  io.on("connection", (socket) => {
    socket.on("job:subscribe", ({ jobId }) => {
      if (jobId) {
        socket.join(`job:${jobId}`);
      }
    });

    socket.on("job:unsubscribe", ({ jobId }) => {
      if (jobId) {
        socket.leave(`job:${jobId}`);
      }
    });
  });
};

module.exports = {
  registerSocketHandlers,
};
