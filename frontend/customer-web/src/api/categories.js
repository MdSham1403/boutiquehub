import { api } from "./client";

export const getCategories = () => api.get("/api/categories").then((r) => r.data);
