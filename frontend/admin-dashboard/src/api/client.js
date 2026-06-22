import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const api = axios.create({ baseURL: BASE_URL });

export function getAdminAuth() {
  const raw = localStorage.getItem("bh_admin_auth");
  return raw ? JSON.parse(raw) : null;
}
export function setAdminAuth(auth) {
  if (auth) localStorage.setItem("bh_admin_auth", JSON.stringify(auth));
  else localStorage.removeItem("bh_admin_auth");
  window.dispatchEvent(new Event("bh-admin-auth-changed"));
}

api.interceptors.request.use((config) => {
  const auth = getAdminAuth();
  if (auth?.access_token) config.headers.Authorization = `Bearer ${auth.access_token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) setAdminAuth(null);
    return Promise.reject(error);
  }
);
