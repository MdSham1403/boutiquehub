import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Trash2, ShoppingBag } from "lucide-react";
import { previewCart } from "../api/cart";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { formatINR } from "../utils/formatCurrency";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";
import StitchDivider from "../components/common/StitchDivider";

export default function Cart() {
  const { items, updateQuantity, removeItem } = useCart();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const { data: preview, isLoading, refetch } = useQuery({
    queryKey: ["cart-preview", items],
    queryFn: () => previewCart(items),
    enabled: items.length > 0,
  });

  useEffect(() => { if (items.length > 0) refetch(); }, [items]);

  if (!items.length) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-20 md:px-8">
        <EmptyState
          title="Your cart is empty"
          description="Discover our latest kurtis, sarees, and more."
          action={<Link to="/search" className="inline-block rounded-full bg-rose px-6 py-2.5 text-sm font-semibold text-white hover:bg-rose-dark">Start Shopping</Link>}
        />
      </main>
    );
  }

  if (isLoading) return <LoadingSpinner label="Checking cart" />;

  const handleCheckout = () => {
    if (!isLoggedIn) { navigate("/login?next=/checkout"); return; }
    navigate("/checkout");
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 md:px-8">
      <h1 className="font-display text-3xl text-espresso mb-6">Your Cart</h1>

      {preview?.has_issues && (
        <div className="mb-4 rounded-xl border border-clay/30 bg-clay/5 px-4 py-3 text-sm text-clay">
          Some items have been updated due to stock changes. Please review before checkout.
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-[1fr_300px]">
        {/* Items */}
        <div className="space-y-4">
          {preview?.items.map((line) => (
            <div key={`${line.product_id}-${line.variant_id}`} className="flex gap-4 rounded-xl bg-white p-4 shadow-card">
              {/* Thumbnail */}
              <Link to={`/products/${line.product_id}`} className="shrink-0 h-24 w-20 rounded-lg overflow-hidden bg-cream">
                {line.image_url
                  ? <img src={line.image_url} alt={line.product_name} className="h-full w-full object-cover" />
                  : <div className="h-full flex items-center justify-center text-2xl">👗</div>
                }
              </Link>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-espresso text-sm leading-tight mb-0.5">{line.product_name}</p>
                <p className="text-xs text-taupe mb-2">{line.color} · {line.size}</p>

                {!line.in_stock && <p className="text-xs text-clay font-medium mb-1">Out of stock — removed from order</p>}
                {line.quantity < line.requested_quantity && line.in_stock && (
                  <p className="text-xs text-clay mb-1">Only {line.available_stock} available</p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 rounded-full border border-cream text-sm">
                    <button
                      onClick={() => updateQuantity(line.product_id, line.variant_id, line.quantity - 1)}
                      className="px-3 py-1 hover:text-rose"
                    >−</button>
                    <span className="min-w-[1.5rem] text-center">{line.quantity}</span>
                    <button
                      onClick={() => updateQuantity(line.product_id, line.variant_id, line.quantity + 1)}
                      className="px-3 py-1 hover:text-rose"
                      disabled={line.quantity >= line.available_stock}
                    >+</button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-espresso">{formatINR(line.line_total)}</span>
                    <button
                      onClick={() => removeItem(line.product_id, line.variant_id)}
                      className="text-taupe hover:text-clay transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="rounded-xl bg-white p-5 shadow-card h-fit sticky top-24">
          <h2 className="font-display text-lg text-espresso mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm text-espresso mb-4">
            <div className="flex justify-between"><span className="text-taupe">Subtotal</span><span>{formatINR(preview?.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-taupe">Shipping</span><span className="text-sage font-medium">Free</span></div>
          </div>
          <StitchDivider className="mb-4" />
          <div className="flex justify-between font-semibold text-espresso mb-5">
            <span>Total</span>
            <span className="font-display text-xl">{formatINR(preview?.total)}</span>
          </div>
          <button
            onClick={handleCheckout}
            className="w-full flex items-center justify-center gap-2 rounded-full bg-rose py-3 text-sm font-semibold text-white hover:bg-rose-dark transition-colors"
          >
            <ShoppingBag size={18} />
            Proceed to Checkout
          </button>
          <Link to="/search" className="mt-3 block text-center text-xs text-taupe hover:text-rose">
            Continue Shopping
          </Link>
        </div>
      </div>
    </main>
  );
}
