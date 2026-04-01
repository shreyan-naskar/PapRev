const curatedStandards = [
  {
    id: "icmje-recommendations",
    title: "ICMJE Recommendations for the Conduct, Reporting, Editing, and Publication of Scholarly Work in Medical Journals",
    url: "https://www.icmje.org/recommendations/",
    disciplines: ["healthcare", "general"],
    tags: ["reporting", "ethics"],
    summary: "Widely used guidance on authorship, disclosure, manuscript preparation, and responsible reporting.",
  },
  {
    id: "consort",
    title: "CONSORT Statement",
    url: "https://www.consort-statement.org/",
    disciplines: ["healthcare"],
    tags: ["reporting", "methods"],
    summary: "Checklist-oriented reporting guidance for randomized and controlled trials.",
  },
  {
    id: "prisma",
    title: "PRISMA Statement",
    url: "https://www.prisma-statement.org/",
    disciplines: ["healthcare", "social-sciences", "general"],
    tags: ["systematic-review", "methods"],
    summary: "Reporting standard for systematic reviews and meta-analyses.",
  },
  {
    id: "equator",
    title: "EQUATOR Network Reporting Guidelines",
    url: "https://www.equator-network.org/",
    disciplines: ["healthcare", "social-sciences", "general"],
    tags: ["reporting", "checklists"],
    summary: "Collection of reporting guidelines spanning many study designs and disciplines.",
  },
  {
    id: "acm-artifact",
    title: "ACM Artifact Review and Badging",
    url: "https://www.acm.org/publications/policies/artifact-review-and-badging-current",
    disciplines: ["computer-science", "machine-learning"],
    tags: ["reproducibility", "artifacts"],
    summary: "Practical expectations for code, data, and experimental artifact transparency in computing research.",
  },
  {
    id: "neurips-checklist",
    title: "NeurIPS Paper Checklist",
    url: "https://neurips.cc/public/guides/PaperChecklist",
    disciplines: ["machine-learning"],
    tags: ["ethics", "checklists"],
    summary: "Reviewer-facing expectations around limitations, societal impact, and reproducibility for ML papers.",
  },
  {
    id: "cope-ethics",
    title: "COPE Core Practices",
    url: "https://publicationethics.org/core-practices",
    disciplines: ["all"],
    tags: ["ethics", "publication"],
    summary: "Publication ethics guidance covering authorship, transparency, conflicts of interest, and integrity.",
  },
];

module.exports = {
  curatedStandards,
};
