export default function StatCard({ label, value, icon: Icon, accent = "brand", sublabel }) {
  const accentClasses = {
    brand: "bg-brand/10 text-brand",
    sage: "bg-sage/10 text-sage",
    clay: "bg-clay/10 text-clay",
    gold: "bg-gold/10 text-gold",
  };
  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted uppercase tracking-wide">{label}</p>
          <p className="mt-1.5 font-display text-2xl text-ink">{value}</p>
          {sublabel && <p className="mt-0.5 text-xs text-muted">{sublabel}</p>}
        </div>
        {Icon && (
          <div className={`rounded-lg p-2 ${accentClasses[accent]}`}>
            <Icon size={18} />
          </div>
        )}
      </div>
    </div>
  );
}
