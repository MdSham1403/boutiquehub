import { Link } from "react-router-dom";
import StitchDivider from "../common/StitchDivider";

const CATEGORIES = ["Kurtis", "Sarees", "Tops", "Leggings", "Chudidars", "Nightwear", "Kids Wear", "Dupattas", "Western Wear"];

export default function Footer() {
  return (
    <footer className="mt-20 bg-espresso text-cream/80 text-sm">
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <p className="font-display text-2xl text-cream font-medium mb-2">
              Boutique<span className="text-rose-light">Hub</span>
            </p>
            <p className="leading-relaxed text-cream/60 max-w-xs">
              Curated ethnic and western wear from boutiques that care about every stitch.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-cream mb-3 uppercase tracking-widest text-xs">Shop</h4>
            <ul className="grid grid-cols-2 gap-1.5">
              {CATEGORIES.map((cat) => (
                <li key={cat}>
                  <Link
                    to={`/search?category=${cat.toLowerCase().replace(/\s+/g, "-")}`}
                    className="hover:text-gold transition-colors"
                  >
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-cream mb-3 uppercase tracking-widest text-xs">Account</h4>
            <ul className="space-y-1.5">
              {[["My Orders", "/account/orders"], ["Wishlist", "/account/wishlist"], ["My Addresses", "/account/addresses"], ["Profile", "/account"]].map(([label, to]) => (
                <li key={to}>
                  <Link to={to} className="hover:text-gold transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <StitchDivider className="my-8 opacity-20" />
        <p className="text-center text-cream/40 text-xs">
          © {new Date().getFullYear()} BoutiqueHub. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
