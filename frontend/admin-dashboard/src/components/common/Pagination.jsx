export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <div className="flex justify-center gap-2 py-6">
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`h-8 w-8 rounded-lg text-sm transition-colors ${page === p ? "bg-brand text-white" : "bg-white border border-border text-ink hover:border-brand"}`}
        >
          {p}
        </button>
      ))}
    </div>
  );
}
