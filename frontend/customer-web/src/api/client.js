import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const api = axios.create({ baseURL: BASE_URL });

function getStoredAuth() {
  const raw = localStorage.getItem("bh_customer_auth");
  return raw ? JSON.parse(raw) : null;
}

export function setStoredAuth(auth) {
  if (auth) {
    localStorage.setItem("bh_customer_auth", JSON.stringify(auth));
  } else {
    localStorage.removeItem("bh_customer_auth");
  }
  window.dispatchEvent(new Event("bh-customer-auth-changed"));
}

api.interceptors.request.use((config) => {
  const auth = getStoredAuth();
  if (auth?.access_token) {
    config.headers.Authorization = `Bearer ${auth.access_token}`;
  }
  return config;
});

// On a 401, clear the stored session so the UI falls back to "logged out"
// state rather than looping on an invalid token. Refresh-token rotation
// can be added here later if silent refresh is needed.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      setStoredAuth(null);
    }
    return Promise.reject(error);
  }
);

export { BASE_URL };
