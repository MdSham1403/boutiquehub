import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/**
 * Wraps a route element and redirects to "/" if the logged-in admin's
 * role isn't in `roles`. Backend endpoints enforce this independently
 * (see require_role in app/auth/dependencies.py) - this is just so the
 * UI doesn't render a page that's about to fail on every API call.
 */
export default function RequireRole({ roles, children }) {
  const { admin } = useAuth();
  if (!admin || !roles.includes(admin.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}
