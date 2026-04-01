import { useCallback, useEffect, useState } from "react";

import { fetchJob, fetchPaper, fetchReport } from "../api/paprevApi";
import { useSocket } from "./useSocket";

export const useReviewJob = ({ jobId, paperId }) => {
  const [state, setState] = useState({
    loading: Boolean(jobId),
    job: null,
    paper: null,
    report: null,
    error: "",
  });

  const loadReport = useCallback(async () => {
    if (!paperId || !jobId) {
      return;
    }

    try {
      const [jobResponse, paperResponse, reportResponse] = await Promise.all([
        fetchJob(jobId),
        fetchPaper(paperId),
        fetchReport(paperId),
      ]);

      setState({
        loading: false,
        job: jobResponse.data,
        paper: paperResponse.data,
        report: reportResponse.data,
        error: "",
      });
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        error: error.message,
      }));
    }
  }, [jobId, paperId]);

  const handleSocketUpdate = useCallback((payload) => {
    setState((current) => ({
      ...current,
      loading: true,
      job: {
        ...(current.job || {}),
        ...payload,
      },
      error: payload.errorMessage || "",
    }));
  }, []);

  const handleSocketCompleted = useCallback((payload) => {
    setState({
      loading: false,
      job: payload.job,
      paper: payload.paper,
      report: payload.report,
      error: "",
    });
  }, []);

  const handleSocketFailed = useCallback((payload) => {
    setState((current) => ({
      ...current,
      loading: false,
      job: {
        ...(current.job || {}),
        ...payload,
      },
      error: payload.errorMessage || "Review job failed.",
    }));
  }, []);

  useSocket({
    jobId,
    onUpdate: handleSocketUpdate,
    onCompleted: handleSocketCompleted,
    onFailed: handleSocketFailed,
  });

  useEffect(() => {
    if (!jobId || !paperId) {
      return undefined;
    }

    let active = true;
    let timer = null;

    const poll = async () => {
      try {
        const [jobResponse, paperResponse] = await Promise.all([fetchJob(jobId), fetchPaper(paperId)]);

        if (!active) {
          return;
        }

        setState((current) => ({
          ...current,
          loading: true,
          job: jobResponse.data,
          paper: paperResponse.data,
          error: "",
        }));

        if (jobResponse.data.status === "completed") {
          await loadReport();
          return;
        }

        if (jobResponse.data.status === "failed") {
          setState({
            loading: false,
            job: jobResponse.data,
            paper: paperResponse.data,
            report: null,
            error: jobResponse.data.errorMessage || "Review job failed.",
          });
          return;
        }

        timer = setTimeout(poll, 1800);
      } catch (error) {
        if (!active) {
          return;
        }

        setState({
          loading: false,
          job: null,
          paper: null,
          report: null,
          error: error.message,
        });
      }
    };

    poll();

    return () => {
      active = false;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [jobId, paperId, loadReport]);

  return state;
};
