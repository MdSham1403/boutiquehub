import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Package, Boxes, ShoppingCart, Users,
  Image, Settings, LogOut, ShieldCheck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

// Which roles can see which nav items. super_admin and admin see
// everything; staff roles see only what's relevant to their job.
const NAV = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", end: true, roles: ["super_admin", "admin"] },
  { to: "/products", icon: Package, label: "Products", roles: ["super_admin", "admin"] },
  { to: "/inventory", icon: Boxes, label: "Inventory", roles: ["super_admin", "admin", "order_manager", "packing_staff"] },
  { to: "/orders", icon: ShoppingCart, label: "Orders", roles: ["super_admin", "admin", "order_manager", "packing_staff", "delivery_staff", "customer_support"] },
  { to: "/customers", icon: Users, label: "Customers", roles: ["super_admin", "admin", "customer_support"] },
  { to: "/banners", icon: Image, label: "Banners", roles: ["super_admin", "admin"] },
  { to: "/staff", icon: ShieldCheck, label: "Staff Accounts", roles: ["super_admin"] },
  { to: "/settings", icon: Settings, label: "Settings", roles: ["super_admin", "admin"] },
];

export default function Sidebar({ mobileOpen, onClose }) {
  const { admin, logout } = useAuth();
  const visibleNav = NAV.filter((item) => item.roles.includes(admin?.role));

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={onClose} />}
      <aside
        className={`fixed z-40 inset-y-0 left-0 w-64 bg-sidebar text-cream/90 flex flex-col transition-transform md:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:static md:translate-x-0`}
      >
        <div className="px-6 py-6">
          <p className="font-display text-xl font-semibold text-white">
            Boutique<span className="text-brand-light">Hub</span>
          </p>
          <p className="text-xs text-white/40 mt-0.5">Admin Dashboard</p>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {visibleNav.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? "bg-brand text-white" : "text-white/70 hover:bg-white/5 hover:text-white"}`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 pb-6 pt-3 border-t border-white/10">
          <div className="px-3 py-2 mb-1">
            <p className="text-sm font-medium text-white truncate">{admin?.full_name}</p>
            <p className="text-xs text-white/40 truncate capitalize">{admin?.role?.replace(/_/g, " ")}</p>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
