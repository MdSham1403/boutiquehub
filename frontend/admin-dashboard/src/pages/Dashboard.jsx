import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  IndianRupee, ShoppingBag, Users, Package, AlertTriangle, Clock,
} from "lucide-react";
import { getDashboardSummary, getSalesChart, getTopProducts } from "../api/dashboard";
import Topbar from "../components/layout/Topbar";
import StatCard from "../components/common/StatCard";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { formatINR } from "../utils/format";

export default function Dashboard() {
  const { openMobileMenu } = useOutletContext();

  const { data: summary, isLoading } = useQuery({ queryKey: ["dashboard-summary"], queryFn: getDashboardSummary });
  const { data: salesChart = [] } = useQuery({ queryKey: ["sales-chart"], queryFn: () => getSalesChart(30) });
  const { data: topProducts = [] } = useQuery({ queryKey: ["top-products"], queryFn: () => getTopProducts(5) });

  if (isLoading) return <LoadingSpinner label="Loading dashboard" />;

  return (
    <div>
      <Topbar title="Dashboard" onMenuClick={openMobileMenu} />

      <div className="p-4 md:p-8 space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard label="Revenue" value={formatINR(summary.revenue_total)} sublabel={`${formatINR(summary.revenue_this_month)} this month`} icon={IndianRupee} accent="sage" />
          <StatCard label="Orders" value={summary.orders_total} icon={ShoppingBag} accent="brand" />
          <StatCard label="Customers" value={summary.customers_total} icon={Users} accent="gold" />
          <StatCard label="Products" value={summary.products_total} icon={Package} accent="brand" />
          <StatCard label="Low Stock" value={summary.low_stock_count} icon={AlertTriangle} accent="gold" />
          <StatCard label="Pending Orders" value={summary.orders_pending} icon={Clock} accent="clay" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl border border-border bg-white p-5">
            <h3 className="font-display text-base text-ink mb-4">Monthly Sales (30 days)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={salesChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
                <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} tick={{ fontSize: 11, fill: "#78716C" }} interval={4} />
                <YAxis tick={{ fontSize: 11, fill: "#78716C" }} />
                <Tooltip
                  formatter={(value, name) => [name === "revenue" ? formatINR(value) : value, name === "revenue" ? "Revenue" : "Orders"]}
                  labelFormatter={(d) => d}
                />
                <Line type="monotone" dataKey="revenue" stroke="#9B2242" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl border border-border bg-white p-5">
            <h3 className="font-display text-base text-ink mb-4">Top Products</h3>
            <div className="space-y-3">
              {topProducts.length === 0 && <p className="text-sm text-muted">No sales data yet.</p>}
              {topProducts.map((p, i) => (
                <div key={p.product_id} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-semibold text-muted">{i + 1}</span>
                  {p.image_url
                    ? <img src={p.image_url} alt="" className="h-10 w-10 rounded-lg object-cover shrink-0" />
                    : <div className="h-10 w-10 rounded-lg bg-surface shrink-0" />
                  }
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink truncate">{p.name}</p>
                    <p className="text-xs text-muted">{p.units_sold} sold</p>
                  </div>
                  <span className="text-sm font-semibold text-ink shrink-0">{formatINR(p.revenue)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-white p-5">
          <h3 className="font-display text-base text-ink mb-4">Order Volume</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={salesChart.slice(-14)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
              <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} tick={{ fontSize: 11, fill: "#78716C" }} />
              <YAxis tick={{ fontSize: 11, fill: "#78716C" }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="orders" fill="#C99B5B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
