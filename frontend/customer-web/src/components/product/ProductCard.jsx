import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { formatINR } from "../../utils/formatCurrency";
import RatingStars from "../common/RatingStars";

export default function ProductCard({ product, onWishlist, isWishlisted }) {
  const effectivePrice = product.offer_price || product.price;

  return (
    <Link
      to={`/products/${product.slug}`}
      className="group block rounded-xl overflow-hidden bg-white shadow-card hover:shadow-lift transition-shadow"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-cream">
        {product.primary_image ? (
          <img
            src={product.primary_image}
            alt={product.name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-taupe/30 text-5xl">👗</div>
        )}

        {product.discount_percent > 0 && (
          <span className="absolute top-2 left-2 rounded bg-rose px-1.5 py-0.5 text-[11px] font-semibold text-white">
            {product.discount_percent}% OFF
          </span>
        )}

        {product.total_stock === 0 && (
          <span className="absolute inset-0 flex items-center justify-center bg-espresso/40 text-white text-xs font-medium">
            Out of Stock
          </span>
        )}

        {onWishlist && (
          <button
            onClick={(e) => { e.preventDefault(); onWishlist(product.id); }}
            className="absolute top-2 right-2 rounded-full bg-white/90 p-1.5 text-taupe hover:text-rose transition-colors"
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart size={16} fill={isWishlisted ? "#9B2242" : "none"} stroke={isWishlisted ? "#9B2242" : "currentColor"} />
          </button>
        )}
      </div>

      <div className="p-3">
        <p className="text-xs text-taupe mb-0.5 truncate">{product.category?.name || ""}</p>
        <h3 className="font-medium text-espresso text-sm leading-tight line-clamp-2 mb-1">{product.name}</h3>
        <RatingStars rating={product.average_rating} count={product.review_count} />
        <div className="flex items-baseline gap-2 mt-1">
          <span className="font-semibold text-espresso">{formatINR(effectivePrice)}</span>
          {product.offer_price && (
            <span className="text-xs text-taupe line-through">{formatINR(product.price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
