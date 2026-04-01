import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { uploadPaper, createTextJob } from "../api/paprevApi";
import { UploadForm } from "../components/upload/UploadForm";
import { API_BASE_URL } from "../api/client";
import { useCapabilities } from "../hooks/useCapabilities";

const createInitialState = () => ({
  title: "",
  venue: "",
  domain: "machine-learning",
  notes: "",
  abstract: "",
  manuscript: "",
  paper: null,
});

export const UploadPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState("upload");
  const [formState, setFormState] = useState(createInitialState);
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const capabilities = useCapabilities();

  const capabilityText = useMemo(() => {
    if (capabilities.error) {
      return `Backend unavailable at ${API_BASE_URL}`;
    }

    if (!capabilities.capabilities) {
      return "Loading backend capabilities...";
    }

    return `${capabilities.capabilities.data.architecture.frontend} frontend · ${capabilities.capabilities.data.architecture.backend} backend`;
  }, [capabilities]);

  const submitWithoutSession = async () => {
    if (mode === "upload") {
      const data = new FormData();
      data.append("paper", formState.paper);
      data.append("title", formState.title);
      data.append("venue", formState.venue);
      data.append("domain", formState.domain);
      data.append("notes", formState.notes);
      data.append("abstract", formState.abstract);
      return uploadPaper(data);
    }

    return createTextJob({
      title: formState.title,
      venue: formState.venue,
      domain: formState.domain,
      notes: formState.notes,
      abstract: formState.abstract,
      manuscript: formState.manuscript,
    });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((current) => ({ ...current, [name]: value }));
  };

  const handleFileChange = (event) => {
    const paper = event.target.files?.[0] || null;
    setFormState((current) => ({ ...current, paper }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("Creating review job...");

    try {
      const response = await submitWithoutSession();
      navigate(`/review/${response.data.paperId}/${response.data.jobId}`);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="content-grid">
      <UploadForm
        mode={mode}
        formState={formState}
        onModeChange={setMode}
        onChange={handleChange}
        onFileChange={handleFileChange}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Project Alignment</p>
            <h2>Current scaffold follows the plan.</h2>
          </div>
        </div>
        <div className="results-root">
          <div className="result-card">
            <h3>Architecture status</h3>
            <p>{capabilityText}</p>
            <p className="subtle">{status || "Starter mode is active. No login is required."}</p>
          </div>
        </div>
      </section>
    </div>
  );
};
