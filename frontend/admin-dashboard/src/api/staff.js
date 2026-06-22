import { api } from "./client";

export const listStaff = () => api.get("/api/admin/staff").then((r) => r.data);
export const createStaff = (payload) => api.post("/api/admin/staff", payload).then((r) => r.data);
export const updateStaff = (id, payload) => api.put(`/api/admin/staff/${id}`, payload).then((r) => r.data);
export const deleteStaff = (id) => api.delete(`/api/admin/staff/${id}`);
