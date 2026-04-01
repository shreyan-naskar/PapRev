const disciplines = [
  { value: "machine-learning", label: "Machine Learning" },
  { value: "computer-science", label: "Computer Science" },
  { value: "healthcare", label: "Healthcare" },
  { value: "social-sciences", label: "Social Sciences" },
  { value: "general", label: "General" },
];

const venues = ["NeurIPS", "ICML", "ICLR", "ACL", "IEEE", "ACM", "Nature"];

export const UploadForm = ({
  mode,
  formState,
  onModeChange,
  onChange,
  onFileChange,
  onSubmit,
  isSubmitting,
}) => (
  <section className="panel">
    <div className="panel-header">
      <div>
        <p className="eyebrow">Upload Workspace</p>
        <h2>Prepare a paper review job.</h2>
      </div>
      <div className="tab-group" role="tablist" aria-label="Submission mode">
        <button
          className={`tab-button ${mode === "upload" ? "is-active" : ""}`}
          type="button"
          onClick={() => onModeChange("upload")}
        >
          PDF Upload
        </button>
        <button
          className={`tab-button ${mode === "text" ? "is-active" : ""}`}
          type="button"
          onClick={() => onModeChange("text")}
        >
          Text Draft
        </button>
      </div>
    </div>

    <form className="submission-form" onSubmit={onSubmit}>
      <div className="field-grid">
        <label>
          <span>Paper title</span>
          <input name="title" value={formState.title} onChange={onChange} required />
        </label>
        <label>
          <span>Target venue</span>
          <input list="venue-options" name="venue" value={formState.venue} onChange={onChange} />
          <datalist id="venue-options">
            {venues.map((venue) => (
              <option key={venue} value={venue} />
            ))}
          </datalist>
        </label>
        <label>
          <span>Research domain</span>
          <select name="domain" value={formState.domain} onChange={onChange}>
            {disciplines.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Specific concerns</span>
          <textarea name="notes" rows="4" value={formState.notes} onChange={onChange} />
        </label>
      </div>

      <label>
        <span>Abstract</span>
        <textarea name="abstract" rows="5" value={formState.abstract} onChange={onChange} />
      </label>

      {mode === "upload" ? (
        <label className="file-field">
          <span>PDF manuscript</span>
          <input type="file" accept="application/pdf,.pdf" onChange={onFileChange} required />
          <small>{formState.paper ? formState.paper.name : "Choose a manuscript PDF to process."}</small>
        </label>
      ) : (
        <label>
          <span>Manuscript text</span>
          <textarea name="manuscript" rows="12" value={formState.manuscript} onChange={onChange} required />
        </label>
      )}

      <button className="button button-primary submit-button" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Create review job"}
      </button>
    </form>
  </section>
);
