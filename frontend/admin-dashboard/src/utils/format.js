export function formatINR(amount) {
  const value = Number(amount || 0);
  return "\u20b9" + value.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(dateStr) {
  return new Date(dateStr).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/**
 * FastAPI returns `detail` as a plain string for most errors, but as an
 * ARRAY of validation error objects for 422s ({type, loc, msg, input}[]).
 * Rendering that array directly as a React child crashes the component
 * ("Objects are not valid as a React child"). This always returns a
 * displayable string.
 */
export function formatApiError(err, fallback = "Something went wrong. Please try again.") {
  if (!err?.response) return "Couldn't reach the server. Check your connection and that the backend is running.";
  if (err.response.status === 401) return "Your session has expired. Please log in again.";

  const detail = err.response.data?.detail;
  if (!detail) return fallback;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((e) => (typeof e === "string" ? e : `${(e.loc || []).slice(-1)[0] || "Field"}: ${e.msg || "invalid value"}`))
      .join("; ");
  }
  return fallback;
}
