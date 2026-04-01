import { useEffect, useState } from "react";

import { fetchPapers } from "../api/paprevApi";
import { PaperHistory } from "../components/dashboard/PaperHistory";

export const DashboardPage = () => {
  const [state, setState] = useState({
    loading: true,
    items: [],
    error: "",
  });

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await fetchPapers();

        if (!active) {
          return;
        }

        setState({
          loading: false,
          items: response.data,
          error: "",
        });
      } catch (error) {
        if (!active) {
          return;
        }

        setState({
          loading: false,
          items: [],
          error: error.message,
        });
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  if (state.error) {
    return (
      <section className="panel">
        <h2>Dashboard unavailable</h2>
        <p>{state.error}</p>
      </section>
    );
  }

  if (state.loading) {
    return (
      <section className="panel">
        <h2>Loading dashboard...</h2>
      </section>
    );
  }

  return <PaperHistory items={state.items} />;
};
