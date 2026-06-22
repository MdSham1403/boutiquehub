import { api } from "./client";

export const adminLogin = (email, password) =>
  api.post("/api/auth/admin/login", { email, password }).then((r) => r.data);

export const changePassword = (currentPassword, newPassword) =>
  api.put("/api/auth/admin/change-password", {
    current_password: currentPassword,
    new_password: newPassword,
  }).then((r) => r.data);
