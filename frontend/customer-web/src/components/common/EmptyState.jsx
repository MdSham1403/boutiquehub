export default function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 px-6 text-center">
      <h3 className="font-display text-lg text-espresso">{title}</h3>
      {description && <p className="max-w-sm text-sm text-taupe">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
