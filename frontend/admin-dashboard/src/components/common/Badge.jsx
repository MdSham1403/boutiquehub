const VARIANTS = {
  default: "bg-surface text-muted",
  success: "bg-sage/10 text-sage",
  warning: "bg-gold/10 text-gold",
  danger: "bg-clay/10 text-clay",
  brand: "bg-brand/10 text-brand",
};

export default function Badge({ children, variant = "default" }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${VARIANTS[variant]}`}>
      {children}
    </span>
  );
}
