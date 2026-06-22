import { api } from "./client";

export const getCategories = (includeInactive = true) =>
  api.get("/api/categories", { params: { include_inactive: includeInactive } }).then((r) => r.data);
export const createCategory = (payload) => api.post("/api/admin/categories", payload).then((r) => r.data);
export const updateCategory = (id, payload) => api.put(`/api/admin/categories/${id}`, payload).then((r) => r.data);
export const deleteCategory = (id) => api.delete(`/api/admin/categories/${id}`);
