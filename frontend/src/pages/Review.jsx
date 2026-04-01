import { Link, useParams } from "react-router-dom";

import { LoadingBar } from "../components/shared/LoadingBar";
import { FeedbackPanel } from "../components/review/FeedbackPanel";
import { useReviewJob } from "../hooks/useReviewJob";
import { API_BASE_URL } from "../api/client";

export const ReviewPage = () => {
  const { paperId, jobId } = useParams();
  const { job, paper, report, error } = useReviewJob({
    paperId,
    jobId,
  });

  return (
    <div className="content-grid review-layout">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Review Status</p>
            <h2>Job {jobId}</h2>
          </div>
          <Link className="button button-secondary" to="/dashboard">
            Open dashboard
          </Link>
        </div>

        <div className="results-root">
          <div className="result-card">
            <h3>Pipeline progress</h3>
            <LoadingBar progress={job?.progress || 0} label={job?.currentStage || "Waiting for updates"} />
            <p className="subtle">Paper ID: {paperId}</p>
            <p className="subtle">Socket-backed updates from {API_BASE_URL}</p>
            {paper?.publicUrl ? (
              <a className="evidence-link" href={paper.publicUrl} target="_blank" rel="noreferrer">
                Open uploaded PDF
              </a>
            ) : null}
            {error ? <p className="notice is-error">{error}</p> : null}
          </div>

          <div className="result-card">
            <h3>Plan-aligned stages</h3>
            <ul>
              <li>Parsing structure and extracting manuscript text</li>
              <li>Retrieving supporting context</li>
              <li>Building structured report findings</li>
              <li>Persisting report and emitting completion events</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Feedback Panel</p>
            <h2>Structured review output</h2>
          </div>
        </div>
        {paper?.publicUrl ? (
          <div className="pdf-preview">
            <iframe src={paper.publicUrl} title="Paper preview" />
          </div>
        ) : null}
        {report ? <FeedbackPanel report={report} /> : <p className="subtle">Waiting for the report to complete.</p>}
      </section>
    </div>
  );
};
