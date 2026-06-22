import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal, X } from "lucide-react";
import { searchProducts } from "../api/products";
import { getCategories } from "../api/categories";
import ProductCard from "../components/product/ProductCard";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";
import { useDebounce } from "../hooks/useDebounce";

const SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];
const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
];

function FilterPanel({ filters, setFilters, categories, onClose }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-espresso">Filters</h3>
        {onClose && (
          <button onClick={onClose} className="text-taupe hover:text-espresso"><X size={20} /></button>
        )}
      </div>

      {/* Category */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-taupe mb-2">Category</p>
        <div className="flex flex-col gap-1.5">
          {categories.map((cat) => (
            <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="category"
                checked={filters.category === cat.slug}
                onChange={() => setFilters((f) => ({ ...f, category: cat.slug, page: 1 }))}
                className="accent-rose"
              />
              <span className="text-sm text-espresso">{cat.name}</span>
            </label>
          ))}
          {filters.category && (
            <button onClick={() => setFilters((f) => ({ ...f, category: "", page: 1 }))} className="text-xs text-rose text-left mt-1">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Size */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-taupe mb-2">Size</p>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={() => setFilters((f) => ({ ...f, size: f.size === s ? "" : s, page: 1 }))}
              className={`rounded border px-2.5 py-1 text-xs font-medium transition-colors ${filters.size === s ? "border-rose bg-rose text-white" : "border-cream text-espresso hover:border-rose"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-taupe mb-2">Price Range</p>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min ₹"
            value={filters.min_price}
            onChange={(e) => setFilters((f) => ({ ...f, min_price: e.target.value, page: 1 }))}
            className="w-full rounded-lg border border-cream px-2 py-1.5 text-sm focus:border-rose"
          />
          <input
            type="number"
            placeholder="Max ₹"
            value={filters.max_price}
            onChange={(e) => setFilters((f) => ({ ...f, max_price: e.target.value, page: 1 }))}
            className="w-full rounded-lg border border-cream px-2 py-1.5 text-sm focus:border-rose"
          />
        </div>
      </div>

      {/* In stock */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={filters.in_stock_only}
          onChange={(e) => setFilters((f) => ({ ...f, in_stock_only: e.target.checked, page: 1 }))}
          className="accent-rose"
        />
        <span className="text-sm text-espresso">In stock only</span>
      </label>
    </div>
  );
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [filters, setFilters] = useState({
    search: searchParams.get("q") || "",
    category: searchParams.get("category") || "",
    size: searchParams.get("size") || "",
    color: "",
    min_price: "",
    max_price: "",
    in_stock_only: false,
    sort_by: searchParams.get("sort_by") || "newest",
    page: 1,
    page_size: 20,
  });

  const debouncedSearch = useDebounce(filters.search);

  const queryParams = {
    ...filters,
    search: debouncedSearch,
  };
  // Remove empty params
  Object.keys(queryParams).forEach((k) => {
    if (queryParams[k] === "" || queryParams[k] === false) delete queryParams[k];
  });

  const { data, isLoading } = useQuery({
    queryKey: ["products", queryParams],
    queryFn: () => searchProducts(queryParams),
    keepPreviousData: true,
  });

  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: getCategories });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <div className="flex flex-col gap-2 mb-6 md:flex-row md:items-center md:justify-between">
        <h1 className="font-display text-2xl text-espresso">
          {filters.category ? categories.find((c) => c.slug === filters.category)?.name || "Products" : filters.search ? `Results for "${filters.search}"` : "All Products"}
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowMobileFilters(true)}
            className="flex items-center gap-1.5 rounded-full border border-cream px-4 py-2 text-sm text-espresso hover:border-rose md:hidden"
          >
            <SlidersHorizontal size={16} /> Filters
          </button>
          <select
            value={filters.sort_by}
            onChange={(e) => setFilters((f) => ({ ...f, sort_by: e.target.value, page: 1 }))}
            className="rounded-full border border-cream px-3 py-2 text-sm focus:border-rose bg-white"
          >
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden md:block w-52 shrink-0">
          <FilterPanel filters={filters} setFilters={setFilters} categories={categories} />
        </aside>

        {/* Product grid */}
        <div className="flex-1">
          {isLoading ? (
            <LoadingSpinner label="Fetching products" />
          ) : data?.items?.length ? (
            <>
              <p className="text-xs text-taupe mb-4">{data.total} products</p>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {data.items.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
              {/* Pagination */}
              {data.total_pages > 1 && (
                <div className="mt-8 flex justify-center gap-2">
                  {Array.from({ length: data.total_pages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setFilters((f) => ({ ...f, page: p }))}
                      className={`h-8 w-8 rounded-full text-sm transition-colors ${filters.page === p ? "bg-rose text-white" : "bg-white border border-cream text-espresso hover:border-rose"}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <EmptyState title="No products found" description="Try adjusting your search or removing some filters." />
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-espresso/40" onClick={() => setShowMobileFilters(false)} />
          <div className="relative ml-auto w-72 bg-white p-6 h-full overflow-y-auto shadow-xl">
            <FilterPanel filters={filters} setFilters={setFilters} categories={categories} onClose={() => setShowMobileFilters(false)} />
          </div>
        </div>
      )}
    </main>
  );
}
