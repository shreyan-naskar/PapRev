const env = require("../config/env");

const postJson = async (url, payload, headers = {}) => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || data.message || `Request failed with status ${response.status}`);
  }

  return data;
};

const submitReviewJobToRag = async (payload) =>
  postJson(`${env.ragServiceUrl}/reviews`, payload, {
    "x-internal-secret": env.internalWebhookSecret,
  });

module.exports = {
  submitReviewJobToRag,
};
