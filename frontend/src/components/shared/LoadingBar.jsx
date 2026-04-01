export const LoadingBar = ({ progress, label }) => (
  <div className="loading-shell">
    <div className="loading-track">
      <div className="loading-fill" style={{ width: `${Math.max(6, progress || 0)}%` }} />
    </div>
    <div className="loading-meta">
      <strong>{progress || 0}%</strong>
      <span>{label}</span>
    </div>
  </div>
);
