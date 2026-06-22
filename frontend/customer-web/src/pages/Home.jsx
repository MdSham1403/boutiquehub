import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { getCategories } from "../api/categories";
import { searchProducts } from "../api/products";
import ProductCard from "../components/product/ProductCard";
import StitchDivider from "../components/common/StitchDivider";
import LoadingSpinner from "../components/common/LoadingSpinner";

const CATEGORY_ICONS = {
  kurtis: "👘", sarees: "🥻", tops: "👚", leggings: "👖",
  chudidars: "👔", nightwear: "🌙", "kids-wear": "🎀",
  dupattas: "🧣", "western-wear": "✨",
};

function CategoryStrip({ categories }) {
  return (
    <section className="py-6">
      <h2 className="sr-only">Shop by Category</h2>
      <div className="flex gap-4 overflow-x-auto no-scrollbar px-4 md:justify-center">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            to={`/search?category=${cat.slug}`}
            className="flex shrink-0 flex-col items-center gap-2 group"
          >
            <div className="h-16 w-16 rounded-full bg-white shadow-card flex items-center justify-center text-2xl group-hover:shadow-lift transition-shadow border-2 border-transparent group-hover:border-gold">
              {CATEGORY_ICONS[cat.slug] || "🛍️"}
            </div>
            <span className="text-xs font-medium text-espresso text-center max-w-[64px] leading-tight">{cat.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ProductSection({ title, products, linkTo, linkLabel = "See all" }) {
  if (!products?.length) return null;
  return (
    <section className="py-8">
      <div className="flex items-end justify-between mb-5 px-4 md:px-8">
        <h2 className="font-display text-2xl text-espresso">{title}</h2>
        {linkTo && (
          <Link to={linkTo} className="flex items-center gap-1 text-sm text-rose hover:text-rose-dark font-medium">
            {linkLabel} <ArrowRight size={14} />
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 px-4 md:grid-cols-4 md:px-8">
        {products.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}

export default function Home() {
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const { data: newArrivals, isLoading: loadingNew } = useQuery({
    queryKey: ["products", "new-arrivals"],
    queryFn: () => searchProducts({ sort_by: "newest", page_size: 8 }),
  });

  const { data: trending } = useQuery({
    queryKey: ["products", "trending"],
    queryFn: () => searchProducts({ sort_by: "rating", page_size: 8 }),
  });

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-espresso text-cream py-16 md:py-24">
        <div className="relative mx-auto max-w-6xl px-4 md:px-8 text-center">
          <p className="text-gold uppercase tracking-widest text-xs font-semibold mb-4">New Season · New You</p>
          <h1 className="font-display text-4xl md:text-6xl font-medium mb-5 leading-tight">
            Every stitch,<br />a story.
          </h1>
          <p className="text-cream/70 max-w-md mx-auto mb-8">
            Handpicked ethnic and western wear from boutiques that put craft before trend.
          </p>
          <Link
            to="/search"
            className="inline-block rounded-full bg-rose px-8 py-3 text-sm font-semibold text-white hover:bg-rose-dark transition-colors"
          >
            Shop Now
          </Link>
        </div>
        {/* Decorative stitching */}
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-ivory" style={{ clipPath: "ellipse(55% 100% at 50% 100%)" }} />
      </section>

      {/* Categories */}
      <CategoryStrip categories={categories} />

      <div className="mx-auto max-w-6xl">
        <StitchDivider className="mx-4 md:mx-8" />

        {/* New Arrivals */}
        {loadingNew ? (
          <LoadingSpinner label="Loading arrivals" />
        ) : (
          <ProductSection
            title="New Arrivals"
            products={newArrivals?.items}
            linkTo="/search?sort_by=newest"
          />
        )}

        <StitchDivider className="mx-4 md:mx-8" />

        {/* Flash Sale Banner */}
        <section className="py-8 px-4 md:px-8">
          <div className="rounded-2xl bg-gradient-to-r from-rose to-rose-light px-8 py-10 text-center text-white">
            <p className="text-xs uppercase tracking-widest font-semibold mb-2 text-white/80">Limited Time</p>
            <h2 className="font-display text-3xl font-medium mb-3">Flash Sale</h2>
            <p className="text-white/80 mb-6 text-sm">Up to 50% off on selected kurtis & sarees</p>
            <Link
              to="/search?min_price=1&max_price=999&sort_by=price_low"
              className="inline-block rounded-full bg-white px-8 py-2.5 text-sm font-semibold text-rose hover:bg-cream transition-colors"
            >
              Shop Sale
            </Link>
          </div>
        </section>

        <StitchDivider className="mx-4 md:mx-8" />

        {/* Trending */}
        <ProductSection
          title="Trending Now"
          products={trending?.items}
          linkTo="/search?sort_by=rating"
        />
      </div>
    </main>
  );
}
