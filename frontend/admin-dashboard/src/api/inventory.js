import { api } from "./client";

export const listInventory = (productId) =>
  api.get("/api/admin/inventory", { params: productId ? { product_id: productId } : {} }).then((r) => r.data);
export const getLowStock = (threshold) =>
  api.get("/api/admin/inventory/low-stock", { params: threshold ? { threshold } : {} }).then((r) => r.data);
export const getOutOfStock = () => api.get("/api/admin/inventory/out-of-stock").then((r) => r.data);

export const addVariant = (productId, payload) =>
  api.post(`/api/admin/products/${productId}/variants`, payload).then((r) => r.data);
export const updateVariant = (variantId, payload) =>
  api.put(`/api/admin/variants/${variantId}`, payload).then((r) => r.data);
export const deleteVariant = (variantId) => api.delete(`/api/admin/variants/${variantId}`);
