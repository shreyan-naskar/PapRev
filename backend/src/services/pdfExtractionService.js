const { PDFParse } = require("pdf-parse");

const normalizeWhitespace = (text) =>
  text
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

const extractPdfText = async (buffer) => {
  const parser = new PDFParse({ data: buffer });
  let parsed;

  try {
    parsed = await parser.getText();
  } finally {
    await parser.destroy();
  }

  const text = normalizeWhitespace(parsed.text || "");

  if (!text) {
    throw new Error("No extractable text was found in the uploaded PDF.");
  }

  return {
    text,
    wordCount: text.split(/\s+/).filter(Boolean).length,
    pageCount: parsed.total || null,
    info: parsed.info || {},
  };
};

module.exports = {
  extractPdfText,
};
