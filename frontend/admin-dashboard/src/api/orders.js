import { api } from "./client";

export const listAdminOrders = (params) => api.get("/api/admin/orders", { params }).then((r) => r.data);
export const getAdminOrder = (id) => api.get(`/api/admin/orders/${id}`).then((r) => r.data);
export const updateOrderStatus = (id, status) =>
  api.patch(`/api/admin/orders/${id}/status`, { status }).then((r) => r.data);
export const verifyPayment = (id, verified) =>
  api.patch(`/api/admin/orders/${id}/verify-payment`, { verified }).then((r) => r.data);
export const cancelOrder = (id) => api.patch(`/api/admin/orders/${id}/cancel`).then((r) => r.data);
export const getAdminInvoice = (id) => api.get(`/api/admin/orders/${id}/invoice`).then((r) => r.data);
