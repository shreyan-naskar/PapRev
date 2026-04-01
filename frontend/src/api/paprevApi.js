import { request } from "./client";

export const fetchCapabilities = () => request("/api/v1/capabilities");
export const fetchHealth = () => request("/api/v1/health");

export const createTextJob = (payload) =>
  request("/api/papers/text", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

export const uploadPaper = (formData) =>
  request("/api/papers/upload", {
    method: "POST",
    body: formData,
  });

export const fetchJob = (jobId) => request(`/api/jobs/${jobId}`);
export const fetchReport = (paperId) => request(`/api/reports/${paperId}`);
export const fetchPapers = () => request("/api/papers");
export const fetchPaper = (paperId) => request(`/api/papers/${paperId}`);
