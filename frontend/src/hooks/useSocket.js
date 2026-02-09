import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

const baseApiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const socketServerUrl = baseApiUrl.replace(/\/api\/?$/, "");

export const useSocket = (token, handlers = {}) => {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token) return undefined;

    const socket = io(socketServerUrl, {
      auth: { token }
    });

    socketRef.current = socket;

    Object.entries(handlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
      socket.disconnect();
    };
  }, [token]);

  return socketRef;
};
