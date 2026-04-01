import { Link } from "react-router-dom";

export const PaperHistory = ({ items }) => (
  <section className="panel">
    <div className="panel-header">
      <div>
        <p className="eyebrow">Dashboard</p>
        <h2>Recent papers and jobs.</h2>
      </div>
    </div>
    <div className="results-root">
      {items.map((item) => (
        <article className="result-card" key={item.paper.id}>
          <header className="row-header">
            <div>
              <h3>{item.paper.originalFilename}</h3>
              <p className="subtle">
                {item.paper.domain} {item.paper.venue ? `· ${item.paper.venue}` : ""}
              </p>
            </div>
            <span className="meta-pill">{item.job?.status || item.paper.status}</span>
          </header>
          <p className="subtle">Uploaded at {new Date(item.paper.uploadedAt).toLocaleString()}</p>
          {item.report ? (
            <p>
              Score: <strong>{item.report.overallScore}</strong> · {item.report.readinessLevel}
            </p>
          ) : null}
          {item.job ? (
            <Link className="button button-secondary" to={`/review/${item.paper.id}/${item.job.id}`}>
              Open review
            </Link>
          ) : null}
        </article>
      ))}
    </div>
  </section>
);
