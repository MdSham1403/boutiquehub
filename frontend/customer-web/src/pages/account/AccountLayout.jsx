import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { User, Package, Heart, MapPin, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const NAV = [
  { to: "/account", icon: User, label: "Profile", end: true },
  { to: "/account/orders", icon: Package, label: "My Orders" },
  { to: "/account/wishlist", icon: Heart, label: "Wishlist" },
  { to: "/account/addresses", icon: MapPin, label: "Addresses" },
];

export default function AccountLayout() {
  const { isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) navigate("/login");
  }, [isLoggedIn]);

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 md:px-8">
      <h1 className="font-display text-3xl text-espresso mb-6">My Account</h1>
      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        {/* Sidebar */}
        <aside className="rounded-xl bg-white shadow-card p-4 h-fit">
          <nav className="space-y-1">
            {NAV.map(({ to, icon: Icon, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? "bg-rose/10 text-rose" : "text-espresso hover:bg-cream"}`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-taupe hover:bg-cream hover:text-clay transition-colors"
            >
              <LogOut size={18} />
              Logout
            </button>
          </nav>
        </aside>

        {/* Page content */}
        <div>
          <Outlet />
        </div>
      </div>
    </main>
  );
}
