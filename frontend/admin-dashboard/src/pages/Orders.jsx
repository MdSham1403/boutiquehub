import { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { listAdminOrders } from "../api/orders";
import Topbar from "../components/layout/Topbar";
import DataTable from "../components/common/DataTable";
import Pagination from "../components/common/Pagination";
import OrderStatusBadge from "../components/common/OrderStatusBadge";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";
import { useDebounce } from "../hooks/useDebounce";
import { formatINR, formatDate } from "../utils/format";

const STATUS_OPTIONS = [
  ["", "All Statuses"], ["pending", "Pending"], ["payment_verification", "Verifying Payment"],
  ["confirmed", "Confirmed"], ["packing", "Packing"], ["shipped", "Shipped"],
  ["out_for_delivery", "Out for Delivery"], ["delivered", "Delivered"],
  ["cancelled", "Cancelled"], ["returned", "Returned"],
];

export default function Orders() {
  const { openMobileMenu } = useOutletContext();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", debouncedSearch, orderStatus, page],
    queryFn: () => listAdminOrders({
      search: debouncedSearch || undefined,
      order_status: orderStatus || undefined,
      page, page_size: 25,
    }),
    keepPreviousData: true,
  });

  return (
    <div>
      <Topbar title="Orders" onMenuClick={openMobileMenu} />

      <div className="p-4 md:p-8">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Order #, customer name, or phone"
              className="w-full rounded-lg border border-border bg-white py-2 pl-9 pr-3 text-sm focus:border-brand focus:outline-none"
            />
          </div>
          <select
            value={orderStatus}
            onChange={(e) => { setOrderStatus(e.target.value); setPage(1); }}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none"
          >
            {STATUS_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>

        {isLoading ? (
          <LoadingSpinner label="Loading orders" />
        ) : !data?.items?.length ? (
          <EmptyState title="No orders found" description="Try adjusting your search or filters." />
        ) : (
          <>
            <DataTable columns={["Order #", "Customer", "Date", "Payment", "Total", "Status"]}>
              {data.items.map((o) => (
                <tr key={o.id} onClick={() => navigate(`/orders/${o.id}`)} className="cursor-pointer hover:bg-surface/40 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-ink">{o.order_number}</td>
                  <td className="px-4 py-3 text-sm text-ink">
                    {o.customer_name}
                    {o.customer_phone && <span className="block text-xs text-muted">{o.customer_phone}</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted whitespace-nowrap">{formatDate(o.created_at)}</td>
                  <td className="px-4 py-3 text-sm text-muted whitespace-nowrap">{o.payment_method === "cod" ? "COD" : "UPI"}</td>
                  <td className="px-4 py-3 text-sm font-medium text-ink whitespace-nowrap">{formatINR(o.total)}</td>
                  <td className="px-4 py-3 whitespace-nowrap"><OrderStatusBadge status={o.status} /></td>
                </tr>
              ))}
            </DataTable>
            <Pagination page={page} totalPages={data.total_pages} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
