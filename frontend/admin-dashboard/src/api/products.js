import { api } from "./client";

export const listAdminProducts = (params) =>
  api.get("/api/admin/products", { params }).then((r) => r.data);
export const getAdminProduct = (id) => api.get(`/api/admin/products/${id}`).then((r) => r.data);
export const createProduct = (payload) => api.post("/api/admin/products", payload).then((r) => r.data);
export const updateProduct = (id, payload) => api.put(`/api/admin/products/${id}`, payload).then((r) => r.data);
export const deleteProduct = (id) => api.delete(`/api/admin/products/${id}`);
export const toggleArchiveProduct = (id, archived) =>
  api.patch(`/api/admin/products/${id}/archive`, null, { params: { archived } }).then((r) => r.data);
export const toggleActiveProduct = (id, active) =>
  api.patch(`/api/admin/products/${id}/toggle-active`, null, { params: { active } }).then((r) => r.data);
export const duplicateProduct = (id) => api.post(`/api/admin/products/${id}/duplicate`).then((r) => r.data);

export const uploadProductImages = (productId, files) => {
  const formData = new FormData();
  files.forEach((f) => formData.append("files", f));
  return api
    .post(`/api/admin/products/${productId}/images`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};
export const deleteProductImage = (productId, imageId) =>
  api.delete(`/api/admin/products/${productId}/images/${imageId}`);

export const uploadProductVideo = (productId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api
    .post(`/api/admin/products/${productId}/video`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};
