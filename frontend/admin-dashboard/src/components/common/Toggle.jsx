export default function Toggle({ checked, onChange, label, disabled = false }) {
  return (
    <label className={`inline-flex items-center gap-2 select-none ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}>
      <span
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-block h-5 w-9 rounded-full transition-colors ${checked ? "bg-brand" : "bg-border"}`}
      >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[18px]" : "translate-x-0.5"}`} />
      </span>
      {label && <span className="text-sm text-ink">{label}</span>}
    </label>
  );
}
