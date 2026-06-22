import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { getAdminAuth, setAdminAuth } from "../api/client";
import { adminLogin } from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(getAdminAuth());

  // Keep React state in sync when the axios interceptor clears auth on a
  // 401 (e.g. expired session) - without this, the UI kept thinking the
  // admin was logged in while every request silently failed.
  useEffect(() => {
    const sync = () => setAuth(getAdminAuth());
    window.addEventListener("bh-admin-auth-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("bh-admin-auth-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await adminLogin(email, password);
    setAdminAuth(data);
    setAuth(data);
    return data;
  }, []);

  const logout = useCallback(() => {
    setAdminAuth(null);
    setAuth(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        admin: auth?.admin || null,
        isLoggedIn: Boolean(auth?.access_token),
        login,
        logout,
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
