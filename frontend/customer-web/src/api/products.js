import { api } from "./client";

export const searchProducts = (params) =>
  api.get("/api/products", { params }).then((r) => r.data);

export const getProductBySlug = (slug) =>
  api.get(`/api/products/${slug}`).then((r) => r.data);

export const getSimilarProducts = (slug) =>
  api.get(`/api/products/${slug}/similar`).then((r) => r.data);
