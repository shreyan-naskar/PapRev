const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:6069").replace(/\/$/, "");
const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL || API_BASE_URL).replace(/\/$/, "");

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.error?.message || "Request failed.");
  }

  return result;
};
export { API_BASE_URL, SOCKET_URL, request };
