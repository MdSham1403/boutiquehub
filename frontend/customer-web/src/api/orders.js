import { api } from "./client";

export const createOrder = (payload) =>
  api.post("/api/orders", payload).then((r) => r.data);

export const getMyOrders = () => api.get("/api/orders").then((r) => r.data);

export const getMyOrder = (orderId) =>
  api.get(`/api/orders/${orderId}`).then((r) => r.data);

export const getMyInvoice = (orderId) =>
  api.get(`/api/orders/${orderId}/invoice`).then((r) => r.data);

export const uploadPaymentScreenshot = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api
    .post("/api/uploads/payment-screenshot", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};
