const { randomUUID } = require("crypto");

const state = {
  users: [],
  papers: [],
  jobs: [],
  reports: [],
};

const clone = (value) => JSON.parse(JSON.stringify(value));

const createUser = (payload) => {
  const user = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    plan: "free",
    institution: "",
    ...payload,
  };

  state.users.push(user);
  return clone(user);
};

const findUserByEmail = (email) => state.users.find((user) => user.email === email);
const findUserById = (id) => state.users.find((user) => user.id === id);

const createPaper = (payload) => {
  const paper = {
    id: randomUUID(),
    uploadedAt: new Date().toISOString(),
    status: "uploaded",
    wordCount: 0,
    detectedSections: [],
    missingSections: [],
    ...payload,
  };

  state.papers.push(paper);
  return clone(paper);
};

const updatePaper = (id, updates) => {
  const paper = state.papers.find((item) => item.id === id);

  if (!paper) {
    return null;
  }

  Object.assign(paper, updates);
  return clone(paper);
};

const findPaperById = (id) => {
  const paper = state.papers.find((item) => item.id === id);
  return paper ? clone(paper) : null;
};

const listPapersByUser = (userId) => clone(state.papers.filter((paper) => paper.userId === userId));

const createJob = (payload) => {
  const job = {
    id: randomUUID(),
    status: "queued",
    progress: 0,
    currentStage: "Queued for processing",
    errorMessage: null,
    startedAt: new Date().toISOString(),
    completedAt: null,
    ...payload,
  };

  state.jobs.push(job);
  return clone(job);
};

const updateJob = (id, updates) => {
  const job = state.jobs.find((item) => item.id === id);

  if (!job) {
    return null;
  }

  Object.assign(job, updates);
  return clone(job);
};

const findJobById = (id) => {
  const job = state.jobs.find((item) => item.id === id);
  return job ? clone(job) : null;
};

const listJobsByUser = (userId) => clone(state.jobs.filter((job) => job.userId === userId));

const createReport = (payload) => {
  const report = {
    id: randomUUID(),
    generatedAt: new Date().toISOString(),
    ...payload,
  };

  state.reports.push(report);
  return clone(report);
};

const findReportByPaperId = (paperId) => {
  const report = state.reports.find((item) => item.paperId === paperId);
  return report ? clone(report) : null;
};

const findReportByJobId = (jobId) => {
  const report = state.reports.find((item) => item.jobId === jobId);
  return report ? clone(report) : null;
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  createPaper,
  updatePaper,
  findPaperById,
  listPapersByUser,
  createJob,
  updateJob,
  findJobById,
  listJobsByUser,
  createReport,
  findReportByPaperId,
  findReportByJobId,
};
