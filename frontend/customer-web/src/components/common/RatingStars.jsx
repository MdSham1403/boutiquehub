import { Star } from "lucide-react";

export default function RatingStars({ rating = 0, count, size = 14 }) {
  if (!rating) return null;
  return (
    <div className="flex items-center gap-1 text-gold">
      <Star size={size} fill="currentColor" strokeWidth={0} />
      <span className="text-xs font-medium text-espresso">{rating.toFixed(1)}</span>
      {count != null && <span className="text-xs text-taupe">({count})</span>}
    </div>
  );
}
