import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Heart, ShoppingBag, User } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";

export default function Header() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { itemCount } = useCart();
  const { isLoggedIn } = useAuth();

  const submitSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-cream bg-ivory/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 md:px-8">
        <Link to="/" className="font-display text-xl font-semibold tracking-tight text-espresso shrink-0">
          Boutique<span className="text-rose">Hub</span>
        </Link>

        <form onSubmit={submitSearch} className="relative hidden flex-1 md:block max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-taupe" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search kurtis, sarees, fabric, colour..."
            className="w-full rounded-full border border-cream bg-white py-2 pl-9 pr-4 text-sm placeholder:text-taupe focus:border-rose"
          />
        </form>

        <nav className="ml-auto flex items-center gap-4 text-espresso">
          <Link to="/wishlist" className="hidden md:flex items-center gap-1.5 text-sm hover:text-rose">
            <Heart size={20} />
          </Link>
          <Link to="/cart" className="relative flex items-center hover:text-rose">
            <ShoppingBag size={20} />
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-rose px-1 text-[10px] font-semibold text-white">
                {itemCount}
              </span>
            )}
          </Link>
          <Link
            to={isLoggedIn ? "/account" : "/login"}
            className="hidden md:flex items-center gap-1.5 text-sm hover:text-rose"
          >
            <User size={20} />
          </Link>
        </nav>
      </div>

      <form onSubmit={submitSearch} className="relative px-4 pb-3 md:hidden">
        <Search size={16} className="absolute left-7 top-1/2 -translate-y-1/2 text-taupe" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search kurtis, sarees, fabric..."
          className="w-full rounded-full border border-cream bg-white py-2 pl-9 pr-4 text-sm placeholder:text-taupe focus:border-rose"
        />
      </form>
    </header>
  );
}
