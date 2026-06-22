import { useOutletContext, useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { getAdminProduct, createProduct, updateProduct } from "../api/products";
import { getCategories } from "../api/categories";
import Topbar from "../components/layout/Topbar";
import ProductForm from "../components/products/ProductForm";
import ProductImageManager from "../components/products/ProductImageManager";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { formatApiError } from "../utils/format";

export default function ProductEditor() {
  const { openMobileMenu } = useOutletContext();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = id === "new";

  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: () => getCategories(true) });

  const { data: product, isLoading, refetch } = useQuery({
    queryKey: ["admin-product", id],
    queryFn: () => getAdminProduct(id),
    enabled: !isNew,
  });

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      navigate(`/products/${created.id}`, { replace: true });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-product", id] });
    },
  });

  if (!isNew && isLoading) return <LoadingSpinner label="Loading product" />;

  return (
    <div>
      <Topbar title={isNew ? "Add Product" : "Edit Product"} onMenuClick={openMobileMenu} />

      <div className="p-4 md:p-8 max-w-4xl">
        <button onClick={() => navigate("/products")} className="flex items-center gap-1.5 text-sm text-muted hover:text-brand mb-5">
          <ArrowLeft size={16} /> Back to Products
        </button>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="rounded-xl border border-border bg-white p-6">
            {updateMutation.isSuccess && (
              <div className="mb-4 rounded-lg bg-sage/10 px-4 py-3 text-sm text-sage">
                Changes saved.
              </div>
            )}
            <ProductForm
              defaultValues={product ? {
                name: product.name, category_id: product.category?.id, sku: product.sku,
                price: product.price, offer_price: product.offer_price, fabric: product.fabric,
                description: product.description, wash_instructions: product.wash_instructions,
                tags: product.tags,
                variants: product.variants.map((v) => ({ color: v.color, size: v.size, stock: v.stock })),
              } : undefined}
              categories={categories}
              loading={createMutation.isPending || updateMutation.isPending}
              submitLabel={isNew ? "Create Product" : "Save Changes"}
              onSubmit={(data) => isNew ? createMutation.mutate(data) : updateMutation.mutate(data)}
            />
          </div>

          <div className="rounded-xl border border-border bg-white p-6 h-fit">
            <h3 className="font-display text-base text-ink mb-4">Media</h3>
            {isNew ? (
              <p className="text-sm text-muted">Save the product first, then upload images and video.</p>
            ) : (
              <ProductImageManager product={product} onUpdate={refetch} />
            )}
          </div>
        </div>

        {(createMutation.isError || updateMutation.isError) && (
          <div className="mt-4 rounded-lg bg-clay/10 px-4 py-3 text-sm text-clay">
            {formatApiError(createMutation.error || updateMutation.error)}
          </div>
        )}
      </div>
    </div>
  );
}
