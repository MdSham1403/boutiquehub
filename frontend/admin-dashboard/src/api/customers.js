import { api } from "./client";

export const listCustomers = (params) => api.get("/api/admin/customers", { params }).then((r) => r.data);
export const getCustomer = (id) => api.get(`/api/admin/customers/${id}`).then((r) => r.data);
