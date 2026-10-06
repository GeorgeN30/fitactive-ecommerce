import axios from "axios";
import { clearStoredSession, getStoredSessionValue } from "../utils/session";

const api = axios.create({
  baseURL: "/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const explicitAuthorization = config.headers.get("Authorization");
  if (explicitAuthorization) {
    return config;
  }

  const token = getStoredSessionValue("token");
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearStoredSession();
    }
    return Promise.reject(error);
  },
);

export default api;
