import { api } from "./client";

export const listBanners = (params) => api.get("/api/admin/banners", { params }).then((r) => r.data);
export const createBanner = (payload) => api.post("/api/admin/banners", payload).then((r) => r.data);
export const updateBanner = (id, payload) => api.put(`/api/admin/banners/${id}`, payload).then((r) => r.data);
export const deleteBanner = (id) => api.delete(`/api/admin/banners/${id}`);
export const uploadBannerImage = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api
    .post("/api/admin/banners/upload-image", formData, { headers: { "Content-Type": "multipart/form-data" } })
    .then((r) => r.data);
};
