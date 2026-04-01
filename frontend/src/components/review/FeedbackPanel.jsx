import { useMemo, useState } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

const severityOrder = {
  critical: 0,
  moderate: 1,
  minor: 2,
};

export const FeedbackPanel = ({ report }) => {
  const [activeTab, setActiveTab] = useState("overview");

  const findings = [...(report.findings || [])].sort(
    (left, right) => (severityOrder[left.severity] || 99) - (severityOrder[right.severity] || 99)
  );

  const radarData = useMemo(
    () =>
      Object.entries(report.dimensionScores || {}).map(([dimension, score]) => ({
        dimension,
        score,
      })),
    [report.dimensionScores]
  );

  return (
    <div className="results-root">
      <div className="tab-group">
        {["overview", "findings", "recommendations", "sources"].map((tab) => (
          <button
            key={tab}
            className={`tab-button ${activeTab === tab ? "is-active" : ""}`}
            type="button"
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "overview" ? (
        <>
          <section className="result-card">
            <h3>Overview</h3>
            <div className="metrics-grid">
              <article className="metric-card">
                <span className="metric-value">{report.overallScore}</span>
                <span className="metric-label">Overall score</span>
              </article>
              <article className="metric-card">
                <span className="metric-value">{report.readinessLevel}</span>
                <span className="metric-label">Readiness level</span>
              </article>
              <article className="metric-card">
                <span className="metric-value">{findings.length}</span>
                <span className="metric-label">Key findings</span>
              </article>
            </div>
            <p className="subtle">
              Source: {report.meta?.source || "unknown"} · LLM: {report.meta?.llmProvider || "unknown"} · Gemini hits:{" "}
              {report.meta?.geminiSuccessCount ?? 0}/{report.meta?.dimensionCount ?? 0}
            </p>
          </section>

          <section className="result-card">
            <h3>Score radar</h3>
            <div className="chart-shell">
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="dimension" />
                  <Radar dataKey="score" stroke="#0d6b59" fill="#0d6b59" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="evidence-grid">
              {Object.entries(report.dimensionScores || {}).map(([key, value]) => (
                <article className="evidence-item" key={key}>
                  <header>
                    <strong>{key}</strong>
                    <span className="meta-pill">{value}</span>
                  </header>
                </article>
              ))}
            </div>
          </section>
        </>
      ) : null}

      {activeTab === "findings" ? (
        <section className="result-card">
          <h3>Findings</h3>
          <div className="concern-list">
            {findings.map((item) => (
              <article className="concern-item" key={`${item.title}-${item.dimensionName}`}>
                <header>
                  <strong>{item.title}</strong>
                  <span className={`severity-pill ${item.severity}`}>{item.severity}</span>
                </header>
                <p>{item.description}</p>
                <p className="subtle">Section: {item.affectedSection}</p>
                <p className="subtle">Suggestion: {item.suggestion}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === "recommendations" ? (
        <section className="result-card">
          <h3>Recommendations</h3>
          <ul>
            {(report.prioritizedRecommendations || []).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {activeTab === "sources" ? (
        <section className="result-card">
          <h3>Retrieved sources</h3>
          <div className="evidence-grid">
            {(report.retrievedSources || []).map((item, index) => (
              <article className="evidence-item" key={`${item.title || item.url}-${index}`}>
                <header>
                  <strong>{item.title || item.url}</strong>
                </header>
                {item.url ? (
                  <a className="evidence-link" href={item.url} target="_blank" rel="noreferrer">
                    Open source
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
};
