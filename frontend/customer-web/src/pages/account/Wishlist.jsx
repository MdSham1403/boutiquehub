import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getWishlist, removeFromWishlist } from "../../api/customer";
import ProductCard from "../../components/product/ProductCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import { Link } from "react-router-dom";

export default function Wishlist() {
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["wishlist"],
    queryFn: getWishlist,
  });

  const removeMutation = useMutation({
    mutationFn: removeFromWishlist,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wishlist"] }),
  });

  if (isLoading) return <LoadingSpinner label="Loading wishlist" />;

  if (!items.length) return (
    <EmptyState
      title="Your wishlist is empty"
      description="Save products you love for later."
      action={<Link to="/search" className="inline-block rounded-full bg-rose px-6 py-2.5 text-sm font-semibold text-white hover:bg-rose-dark">Discover Products</Link>}
    />
  );

  return (
    <div>
      <h2 className="font-display text-xl text-espresso mb-5">Wishlist ({items.length})</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {items.map(({ id, product }) => (
          <ProductCard
            key={id}
            product={product}
            isWishlisted
            onWishlist={() => removeMutation.mutate(product.id)}
          />
        ))}
      </div>
    </div>
  );
}
