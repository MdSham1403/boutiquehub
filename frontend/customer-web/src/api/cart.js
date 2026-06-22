import { api } from "./client";

export const previewCart = (items) =>
  api.post("/api/cart/preview", items).then((r) => r.data);
