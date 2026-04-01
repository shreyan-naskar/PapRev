const AppError = require("../utils/appError");

const notFoundHandler = (req, res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
};

const globalErrorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Something went wrong.";

  if (err.name === "MulterError") {
    statusCode = 400;

    if (err.code === "LIMIT_FILE_SIZE") {
      message = "Uploaded PDF exceeds the 15MB file size limit.";
    } else {
      message = "The upload could not be processed.";
    }
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
      ...(process.env.NODE_ENV !== "production" ? { stack: err.stack } : {}),
    },
  });
};

module.exports = {
  notFoundHandler,
  globalErrorHandler,
};
