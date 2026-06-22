import { api } from "./client";

export const loginWithGoogle = (idToken) =>
  api.post("/api/auth/customer/google", { id_token: idToken }).then((r) => r.data);

export const registerWithEmail = (name, email, password, mobileNumber) =>
  api.post("/api/auth/customer/register", {
    name, email, password, mobile_number: mobileNumber || undefined,
  }).then((r) => r.data);

export const loginWithEmail = (email, password) =>
  api.post("/api/auth/customer/login", { email, password }).then((r) => r.data);
