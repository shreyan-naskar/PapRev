let ioInstance = null;

const initializeSocket = (io) => {
  ioInstance = io;
};

const emitJobUpdate = (jobId, payload) => {
  if (!ioInstance || !jobId) {
    return;
  }

  ioInstance.to(`job:${jobId}`).emit("job:update", payload);
};

const emitJobCompleted = (jobId, payload) => {
  if (!ioInstance || !jobId) {
    return;
  }

  ioInstance.to(`job:${jobId}`).emit("job:completed", payload);
};

const emitJobFailed = (jobId, payload) => {
  if (!ioInstance || !jobId) {
    return;
  }

  ioInstance.to(`job:${jobId}`).emit("job:failed", payload);
};

module.exports = {
  initializeSocket,
  emitJobUpdate,
  emitJobCompleted,
  emitJobFailed,
};
