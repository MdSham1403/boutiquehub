import { api } from "./client";

export const getDashboardSummary = () => api.get("/api/admin/dashboard/summary").then((r) => r.data);
export const getSalesChart = (days = 30) =>
  api.get("/api/admin/dashboard/sales-chart", { params: { days } }).then((r) => r.data);
export const getTopProducts = (limit = 5) =>
  api.get("/api/admin/dashboard/top-products", { params: { limit } }).then((r) => r.data);
