import { api } from "./client";

export const getStoreSettings = () => api.get("/api/store-settings").then((r) => r.data);
export const updateStoreSettings = (payload) => api.put("/api/admin/store-settings", payload).then((r) => r.data);

export const uploadUpiQr = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api
    .post("/api/admin/store-settings/upi-qr", formData, { headers: { "Content-Type": "multipart/form-data" } })
    .then((r) => r.data);
};
export const uploadStoreLogo = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api
    .post("/api/admin/store-settings/logo", formData, { headers: { "Content-Type": "multipart/form-data" } })
    .then((r) => r.data);
};
