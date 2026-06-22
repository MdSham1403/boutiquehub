import { api } from "./client";

export const sendTestNotification = () => api.post("/api/admin/notifications/test").then((r) => r.data);
export const triggerDailySummary = () => api.post("/api/admin/notifications/daily-summary").then((r) => r.data);
