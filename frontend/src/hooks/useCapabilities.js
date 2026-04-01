import { useEffect, useState } from "react";

import { fetchCapabilities, fetchHealth } from "../api/paprevApi";

export const useCapabilities = () => {
  const [state, setState] = useState({
    loading: true,
    health: null,
    capabilities: null,
    error: "",
  });

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const [health, capabilities] = await Promise.all([fetchHealth(), fetchCapabilities()]);

        if (!mounted) {
          return;
        }

        setState({
          loading: false,
          health,
          capabilities,
          error: "",
        });
      } catch (error) {
        if (!mounted) {
          return;
        }

        setState({
          loading: false,
          health: null,
          capabilities: null,
          error: error.message,
        });
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  return state;
};
