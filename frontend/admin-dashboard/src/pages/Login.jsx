import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { isLoggedIn, login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    if (isLoggedIn) navigate("/", { replace: true });
  }, [isLoggedIn]);

  const onSubmit = async ({ email, password }) => {
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-sidebar px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <p className="font-display text-3xl font-semibold text-white">
            Boutique<span className="text-brand-light">Hub</span>
          </p>
          <p className="text-sm text-white/50 mt-1">Admin Dashboard</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <h2 className="font-display text-xl text-ink mb-5">Sign in</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Email</label>
              <input
                {...register("email", { required: "Email is required" })}
                type="email"
                placeholder="admin@boutiquehub.com"
                className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
              />
              {errors.email && <p className="mt-1 text-xs text-clay">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">Password</label>
              <input
                {...register("password", { required: "Password is required" })}
                type="password"
                placeholder="••••••••"
                className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
              />
              {errors.password && <p className="mt-1 text-xs text-clay">{errors.password.message}</p>}
            </div>

            {error && (
              <div className="rounded-lg bg-clay/10 px-3 py-2 text-sm text-clay">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50 transition-colors"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
