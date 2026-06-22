import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Heart, Share2, ShoppingBag } from "lucide-react";
import { getProductBySlug, getSimilarProducts } from "../api/products";
import { addToWishlist, removeFromWishlist, getWishlist } from "../api/customer";
import ImageGallery from "../components/product/ImageGallery";
import ProductCard from "../components/product/ProductCard";
import RatingStars from "../components/common/RatingStars";
import LoadingSpinner from "../components/common/LoadingSpinner";
import StitchDivider from "../components/common/StitchDivider";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { formatINR } from "../utils/formatCurrency";

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { isLoggedIn } = useAuth();
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => getProductBySlug(slug),
  });

  const { data: similar = [] } = useQuery({
    queryKey: ["similar", slug],
    queryFn: () => getSimilarProducts(slug),
    enabled: !!slug,
  });

  const { data: wishlistItems = [], refetch: refetchWishlist } = useQuery({
    queryKey: ["wishlist"],
    queryFn: getWishlist,
    enabled: isLoggedIn,
  });

  if (isLoading) return <LoadingSpinner label="Loading product" />;
  if (!product) return <div className="py-20 text-center text-taupe">Product not found.</div>;

  const colors = [...new Set(product.variants.map((v) => v.color))];
  const sizes = selectedColor
    ? product.variants.filter((v) => v.color === selectedColor && v.stock > 0).map((v) => v.size)
    : [];
  const selectedVariant = product.variants.find((v) => v.color === selectedColor && v.size === selectedSize);
  const isWishlisted = wishlistItems.some?.((w) => w.product?.id === product.id);
  const effectivePrice = product.offer_price || product.price;

  const handleAddToCart = () => {
    if (!selectedVariant) return;
    addItem({ product_id: product.id, variant_id: selectedVariant.id, quantity: qty });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleWishlist = async () => {
    if (!isLoggedIn) { navigate("/login"); return; }
    if (isWishlisted) await removeFromWishlist(product.id);
    else await addToWishlist(product.id);
    refetchWishlist();
  };

  const handleShare = () => {
    navigator.share?.({ title: product.name, url: window.location.href });
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <div className="grid gap-10 md:grid-cols-2">
        {/* Gallery */}
        <ImageGallery images={product.images} productName={product.name} />

        {/* Info */}
        <div>
          <p className="text-sm text-taupe mb-1">{product.category?.name}</p>
          <h1 className="font-display text-3xl text-espresso mb-2">{product.name}</h1>

          <div className="flex items-center gap-3 mb-4">
            <RatingStars rating={product.average_rating} count={product.review_count} size={16} />
          </div>

          <div className="flex items-baseline gap-3 mb-6">
            <span className="font-display text-3xl text-espresso">{formatINR(effectivePrice)}</span>
            {product.offer_price && (
              <>
                <span className="text-taupe line-through">{formatINR(product.price)}</span>
                <span className="rounded bg-rose/10 px-2 py-0.5 text-xs font-semibold text-rose">
                  {product.discount_percent}% OFF
                </span>
              </>
            )}
          </div>

          {product.total_stock === 0 && (
            <div className="mb-4 rounded-lg bg-clay/10 px-4 py-2 text-sm text-clay font-medium">Out of Stock</div>
          )}

          <StitchDivider className="mb-5" />

          {/* Color */}
          <div className="mb-5">
            <p className="text-sm font-semibold text-espresso mb-2">
              Colour {selectedColor && <span className="font-normal text-taupe">— {selectedColor}</span>}
            </p>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => { setSelectedColor(c); setSelectedSize(null); }}
                  className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${selectedColor === c ? "border-rose bg-rose text-white" : "border-cream text-espresso hover:border-rose"}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          {selectedColor && (
            <div className="mb-5">
              <p className="text-sm font-semibold text-espresso mb-2">
                Size {selectedSize && <span className="font-normal text-taupe">— {selectedSize}</span>}
              </p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`h-10 w-14 rounded-lg border text-sm font-medium transition-colors ${selectedSize === s ? "border-rose bg-rose text-white" : "border-cream text-espresso hover:border-rose"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          {selectedVariant && (
            <div className="mb-5">
              <p className="text-sm font-semibold text-espresso mb-2">Quantity</p>
              <div className="flex items-center gap-3 w-fit rounded-full border border-cream">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-4 py-2 text-espresso hover:text-rose transition-colors">−</button>
                <span className="min-w-[2ch] text-center text-sm font-medium text-espresso">{qty}</span>
                <button onClick={() => setQty((q) => Math.min(selectedVariant.stock, q + 1))} className="px-4 py-2 text-espresso hover:text-rose transition-colors">+</button>
              </div>
              <p className="mt-1 text-xs text-taupe">{selectedVariant.stock} in stock</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={handleAddToCart}
              disabled={!selectedVariant || added}
              className="flex-1 flex items-center justify-center gap-2 rounded-full bg-rose py-3 text-sm font-semibold text-white hover:bg-rose-dark disabled:opacity-50 transition-colors"
            >
              <ShoppingBag size={18} />
              {added ? "Added!" : "Add to Cart"}
            </button>
            <button onClick={handleWishlist} className="rounded-full border border-cream p-3 hover:border-rose transition-colors" aria-label="Wishlist">
              <Heart size={20} fill={isWishlisted ? "#9B2242" : "none"} stroke={isWishlisted ? "#9B2242" : "currentColor"} />
            </button>
            <button onClick={handleShare} className="rounded-full border border-cream p-3 hover:border-rose transition-colors" aria-label="Share">
              <Share2 size={20} />
            </button>
          </div>

          {/* Details */}
          {product.fabric && (
            <div className="rounded-xl bg-cream p-4 text-sm text-espresso space-y-1.5">
              {product.fabric && <p><span className="font-medium">Fabric:</span> {product.fabric}</p>}
              {product.wash_instructions && <p><span className="font-medium">Care:</span> {product.wash_instructions}</p>}
              {product.sku && <p className="text-taupe text-xs">SKU: {product.sku}</p>}
            </div>
          )}

          {product.description && (
            <p className="mt-4 text-sm text-taupe leading-relaxed">{product.description}</p>
          )}
        </div>
      </div>

      {/* Similar products */}
      {similar.length > 0 && (
        <section className="mt-16">
          <StitchDivider className="mb-8" />
          <h2 className="font-display text-2xl text-espresso mb-5">You may also like</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {similar.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </main>
  );
}
