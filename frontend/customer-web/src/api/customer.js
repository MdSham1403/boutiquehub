import { api } from "./client";

export const getProfile = () => api.get("/api/customer/me").then((r) => r.data);
export const updateProfile = (payload) =>
  api.put("/api/customer/me", payload).then((r) => r.data);

export const getAddresses = () => api.get("/api/customer/addresses").then((r) => r.data);
export const createAddress = (payload) =>
  api.post("/api/customer/addresses", payload).then((r) => r.data);
export const updateAddress = (id, payload) =>
  api.put(`/api/customer/addresses/${id}`, payload).then((r) => r.data);
export const deleteAddress = (id) => api.delete(`/api/customer/addresses/${id}`);

export const getWishlist = () => api.get("/api/customer/wishlist").then((r) => r.data);
export const addToWishlist = (productId) =>
  api.post(`/api/customer/wishlist/${productId}`).then((r) => r.data);
export const removeFromWishlist = (productId) =>
  api.delete(`/api/customer/wishlist/${productId}`);
