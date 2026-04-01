const multer = require("multer");

const AppError = require("../utils/appError");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const isPdf = file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      cb(new AppError("Only PDF uploads are supported for manuscript extraction.", 400));
      return;
    }

    cb(null, true);
  },
});

const uploadSinglePdf = upload.single("paper");

module.exports = {
  uploadSinglePdf,
};
