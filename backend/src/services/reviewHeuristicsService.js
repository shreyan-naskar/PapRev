const sectionLabels = {
  abstract: "Abstract",
  introduction: "Introduction",
  literatureReview: "Related work / literature review",
  methodology: "Methodology",
  results: "Results / evaluation",
  discussion: "Discussion",
  limitations: "Limitations",
  conclusion: "Conclusion",
  ethics: "Ethics / human subjects",
  reproducibility: "Reproducibility / availability",
  references: "References",
};

const buildSeverity = (
  missingCoreSections,
  methodologySignals,
  readabilityFlags,
) => {
  let score = 86;

  score -= missingCoreSections.length * 9;
  score -= methodologySignals.missingSignals.length * 3;
  score -= readabilityFlags.length * 2;

  return Math.max(25, Math.min(96, score));
};

const buildSectionFeedback = (analysis) =>
  Object.entries(sectionLabels).map(([sectionKey, label]) => {
    const present = analysis.sectionPresence[sectionKey];
    return {
      section: label,
      present,
      feedback: present
        ? "This section appears to be present, but it should still be checked for clarity and reviewer expectations."
        : `This section is missing or not clearly signposted. Reviewers often penalize drafts when ${label.toLowerCase()} is hard to locate.`,
    };
  });

const buildMajorConcerns = ({ analysis, retrieval }) => {
  const concerns = [];

  if (analysis.missingCoreSections.length) {
    concerns.push({
      title: "Core scholarly structure is incomplete",
      severity: "high",
      rationale: `Missing core sections: ${analysis.missingCoreSections.join(", ")}.`,
    });
  }

  if (analysis.methodologySignals.missingSignals.includes("baseline")) {
    concerns.push({
      title: "Comparative evaluation is underspecified",
      severity: "high",
      rationale:
        "The manuscript does not clearly signal baseline systems, comparison points, or benchmark framing.",
    });
  }

  if (analysis.methodologySignals.missingSignals.includes("limitations")) {
    concerns.push({
      title: "Limitations are not stated explicitly",
      severity: "medium",
      rationale:
        "A limitations section helps reviewers trust the paper's scope and claims.",
    });
  }

  if (!retrieval.papers.length) {
    concerns.push({
      title: "External literature retrieval returned sparse support",
      severity: "medium",
      rationale:
        "The draft may need sharper terminology, keywords, or citation framing to anchor it in current literature.",
    });
  }

  return concerns;
};

const buildImprovementActions = ({ analysis, retrieval }) => {
  const actions = [];

  if (analysis.missingCoreSections.includes("methodology")) {
    actions.push(
      "Add a clearly titled methodology section describing data, procedure, assumptions, and evaluation protocol.",
    );
  }

  if (analysis.methodologySignals.missingSignals.includes("researchQuestion")) {
    actions.push(
      "State the research question or hypothesis explicitly near the end of the introduction.",
    );
  }

  if (analysis.methodologySignals.missingSignals.includes("statistics")) {
    actions.push(
      "Include statistical testing, confidence intervals, or uncertainty analysis where empirical claims are made.",
    );
  }

  if (analysis.methodologySignals.missingSignals.includes("reproducibility")) {
    actions.push(
      "Add a reproducibility statement covering code, data, hyperparameters, and experimental settings.",
    );
  }

  if (analysis.writingSignals.readabilityFlags.length) {
    actions.push(
      "Tighten long sentences and split large paragraphs so reviewers can scan claims, evidence, and limitations quickly.",
    );
  }

  if (retrieval.papers.length) {
    actions.push(
      `Cross-check your positioning against retrieved literature such as "${retrieval.papers[0].title}" and update novelty claims accordingly.`,
    );
  }

  return actions;
};

const buildQuestionsForAuthor = ({ analysis }) => {
  const questions = [];

  if (analysis.methodologySignals.missingSignals.includes("dataset")) {
    questions.push(
      "What exact dataset, participant pool, or data collection process supports the study?",
    );
  }

  if (analysis.methodologySignals.missingSignals.includes("ablation")) {
    questions.push(
      "Can you isolate the contribution of each major component through ablation or sensitivity analysis?",
    );
  }

  if (!analysis.sectionPresence.ethics) {
    questions.push(
      "Does the work require an ethics, privacy, or consent statement?",
    );
  }

  return questions;
};

const buildHeuristicReview = ({ payload, analysis, retrieval }) => {
  const readinessScore = buildSeverity(
    analysis.missingCoreSections,
    analysis.methodologySignals,
    analysis.writingSignals.readabilityFlags,
  );

  return {
    executiveSummary: `The draft titled "${payload.title}" shows ${analysis.detectedHeadings.length || "limited"} structural signals. The strongest immediate gains are in section completeness, methodological clarity, and reviewer-facing transparency.`,
    readinessScore,
    verdict:
      readinessScore >= 80
        ? "Promising draft, but it still needs a targeted pre-submission revision pass."
        : "Not yet submission-ready; major structural and methodological revisions are recommended.",
    sectionFeedback: buildSectionFeedback(analysis),
    majorConcerns: buildMajorConcerns({ analysis, retrieval }),
    improvementActions: buildImprovementActions({ analysis, retrieval }),
    questionsForAuthor: buildQuestionsForAuthor({ analysis }),
    evidence: {
      standardsConsidered: retrieval.standards.map((item) => ({
        title: item.title,
        url: item.url,
      })),
      relatedLiterature: retrieval.papers.slice(0, 5).map((item) => ({
        title: item.title,
        source: item.source,
        year: item.year,
        url: item.url,
      })),
    },
    meta: {
      generatedBy: "heuristic-review-engine",
      generatedAt: new Date().toISOString(),
    },
  };
};

module.exports = {
  buildHeuristicReview,
};
