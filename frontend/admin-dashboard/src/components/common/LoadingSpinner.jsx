export default function LoadingSpinner({ label = "Loading" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      <p className="text-sm">{label}...</p>
    </div>
  );
}
