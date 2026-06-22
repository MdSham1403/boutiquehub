import { api } from "./client";

export const getStoreSettings = () => api.get("/api/store-settings").then((r) => r.data);
