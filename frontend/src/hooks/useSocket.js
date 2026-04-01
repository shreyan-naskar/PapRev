import { useEffect } from "react";
import { io } from "socket.io-client";

import { SOCKET_URL } from "../api/client";

export const useSocket = ({ jobId, onUpdate, onCompleted, onFailed }) => {
  useEffect(() => {
    if (!jobId) {
      return undefined;
    }

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      socket.emit("job:subscribe", { jobId });
    });

    socket.on("job:update", (payload) => {
      onUpdate?.(payload);
    });

    socket.on("job:completed", (payload) => {
      onCompleted?.(payload);
    });

    socket.on("job:failed", (payload) => {
      onFailed?.(payload);
    });

    return () => {
      socket.emit("job:unsubscribe", { jobId });
      socket.disconnect();
    };
  }, [jobId, onCompleted, onFailed, onUpdate]);
};
