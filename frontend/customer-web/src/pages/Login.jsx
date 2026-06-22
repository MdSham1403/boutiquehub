import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import GoogleLoginButton from "../components/common/GoogleLoginButton";

export default function Login() {
  const { isLoggedIn, loginWithEmail, registerWithEmail } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get("next") || "/account";
  const [error, setError] = useState("");
  const [mode, setMode] = useState("google"); // "google" | "signin" | "signup"
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    if (isLoggedIn) navigate(next, { replace: true });
  }, [isLoggedIn, navigate, next]);

  const handleGoogleError = (err) => {
    console.error("Login failed:", err);
    if (err?.response?.status === 401) {
      setError("Google sign-in was rejected by the server. This usually means the Google Client ID doesn't match between the frontend and backend, or your domain isn't an authorized origin in Google Cloud Console.");
    } else if (err?.message === "Network Error" || !err?.response) {
      setError("Couldn't reach the server. Check that the backend is running and VITE_API_BASE_URL is correct.");
    } else {
      setError("Something went wrong signing in. Please try again.");
    }
  };

  const onEmailSubmit = async (data) => {
    setError("");
    setLoading(true);
    try {
      if (mode === "signup") {
        await registerWithEmail(data.name, data.email, data.password, data.mobile_number);
      } else {
        await loginWithEmail(data.email, data.password);
      }
      navigate(next, { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl bg-white p-8 shadow-card text-center">
          <p className="font-display text-3xl text-espresso mb-1">
            Boutique<span className="text-rose">Hub</span>
          </p>
          <p className="text-sm text-taupe mb-6">
            {mode === "signup" ? "Create your account" : "Sign in to continue shopping"}
          </p>

          {error && (
            <div className="mb-4 rounded-lg bg-clay/10 px-4 py-3 text-left text-xs text-clay leading-relaxed">
              {error}
            </div>
          )}

          {mode === "google" ? (
            <>
              <div className="flex justify-center mb-5">
                <GoogleLoginButton
                  onSuccess={() => navigate(next, { replace: true })}
                  onError={handleGoogleError}
                />
              </div>
              <div className="flex items-center gap-3 mb-5">
                <div className="stitch-divider flex-1" />
                <span className="text-xs text-taupe">or</span>
                <div className="stitch-divider flex-1" />
              </div>
              <button
                onClick={() => { setMode("signin"); setError(""); }}
                className="w-full rounded-full border border-cream py-2.5 text-sm font-medium text-espresso hover:border-rose transition-colors"
              >
                Sign in with Email
              </button>
            </>
          ) : (
            <form onSubmit={handleSubmit(onEmailSubmit)} className="text-left space-y-3 mb-5">
              {mode === "signup" && (
                <div>
                  <label className="block text-xs font-medium text-espresso mb-1">Full Name</label>
                  <input {...register("name", { required: "Name is required" })} className="w-full rounded-lg border border-cream px-3 py-2 text-sm focus:border-rose focus:outline-none" />
                  {errors.name && <p className="mt-0.5 text-xs text-clay">{errors.name.message}</p>}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-espresso mb-1">Email</label>
                <input {...register("email", { required: "Email is required" })} type="email" className="w-full rounded-lg border border-cream px-3 py-2 text-sm focus:border-rose focus:outline-none" />
                {errors.email && <p className="mt-0.5 text-xs text-clay">{errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-espresso mb-1">Password</label>
                <input {...register("password", { required: "Password is required", minLength: mode === "signup" ? { value: 8, message: "At least 8 characters" } : undefined })} type="password" className="w-full rounded-lg border border-cream px-3 py-2 text-sm focus:border-rose focus:outline-none" />
                {errors.password && <p className="mt-0.5 text-xs text-clay">{errors.password.message}</p>}
              </div>
              {mode === "signup" && (
                <div>
                  <label className="block text-xs font-medium text-espresso mb-1">Mobile Number (optional)</label>
                  <input {...register("mobile_number")} className="w-full rounded-lg border border-cream px-3 py-2 text-sm focus:border-rose focus:outline-none" />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-rose py-2.5 text-sm font-semibold text-white hover:bg-rose-dark disabled:opacity-50 transition-colors"
              >
                {loading ? "Please wait..." : mode === "signup" ? "Create Account" : "Sign In"}
              </button>

              <p className="text-center text-xs text-taupe">
                {mode === "signup" ? (
                  <>Already have an account? <button type="button" onClick={() => { setMode("signin"); setError(""); }} className="text-rose hover:underline">Sign in</button></>
                ) : (
                  <>New here? <button type="button" onClick={() => { setMode("signup"); setError(""); }} className="text-rose hover:underline">Create an account</button></>
                )}
              </p>
              <button type="button" onClick={() => { setMode("google"); setError(""); }} className="block w-full text-center text-xs text-taupe hover:text-rose">
                ← Back to Google sign-in
              </button>
            </form>
          )}

          <div className="stitch-divider mb-5" />

          <p className="text-xs text-taupe leading-relaxed">
            By continuing, you agree to our{" "}
            <Link to="/terms" className="text-rose hover:underline">Terms of Service</Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-rose hover:underline">Privacy Policy</Link>.
          </p>
        </div>

        {import.meta.env.VITE_ADMIN_URL && (
          <p className="mt-6 text-center text-xs text-taupe">
            Store owner or staff?{" "}
            <a href={import.meta.env.VITE_ADMIN_URL} className="text-rose hover:underline">
              Go to the Admin Dashboard →
            </a>
          </p>
        )}
      </div>
    </main>
  );
}
