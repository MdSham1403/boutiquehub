import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { setStoredAuth } from "../api/client";
import { loginWithGoogle, loginWithEmail as apiLoginWithEmail, registerWithEmail as apiRegisterWithEmail } from "../api/auth";

const AuthContext = createContext(null);

function readStoredAuth() {
  const raw = localStorage.getItem("bh_customer_auth");
  return raw ? JSON.parse(raw) : null;
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStoredAuth());

  useEffect(() => {
    // Same-tab: the axios interceptor clears localStorage directly on a 401
    // and fires this event so React state stays in sync (it doesn't update
    // automatically just because localStorage changed in the same tab).
    const sync = () => setAuth(readStoredAuth());
    window.addEventListener("bh-customer-auth-changed", sync);
    // Cross-tab: native storage event only fires in OTHER tabs
    const onStorage = (e) => {
      if (e.key === "bh_customer_auth") setAuth(readStoredAuth());
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("bh-customer-auth-changed", sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const loginWithIdToken = useCallback(async (idToken) => {
    const data = await loginWithGoogle(idToken);
    setStoredAuth(data);
    setAuth(data);
    return data;
  }, []);

  const loginWithEmail = useCallback(async (email, password) => {
    const data = await apiLoginWithEmail(email, password);
    setStoredAuth(data);
    setAuth(data);
    return data;
  }, []);

  const registerWithEmail = useCallback(async (name, email, password, mobileNumber) => {
    const data = await apiRegisterWithEmail(name, email, password, mobileNumber);
    setStoredAuth(data);
    setAuth(data);
    return data;
  }, []);

  const logout = useCallback(() => {
    setStoredAuth(null);
    setAuth(null);
  }, []);

  const updateCustomer = useCallback((customer) => {
    setAuth((prev) => {
      const next = { ...prev, customer };
      setStoredAuth(next);
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        customer: auth?.customer || null,
        isLoggedIn: Boolean(auth?.access_token),
        loginWithIdToken,
        loginWithEmail,
        registerWithEmail,
        logout,
        updateCustomer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
