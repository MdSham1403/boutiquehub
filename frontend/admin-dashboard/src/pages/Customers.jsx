import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { listCustomers } from "../api/customers";
import Topbar from "../components/layout/Topbar";
import DataTable from "../components/common/DataTable";
import Pagination from "../components/common/Pagination";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";
import { useDebounce } from "../hooks/useDebounce";
import { formatINR, formatDate } from "../utils/format";

export default function Customers() {
  const { openMobileMenu } = useOutletContext();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-customers", debouncedSearch, page],
    queryFn: () => listCustomers({ search: debouncedSearch || undefined, page, page_size: 25 }),
    keepPreviousData: true,
  });

  return (
    <div>
      <Topbar title="Customers" onMenuClick={openMobileMenu} />

      <div className="p-4 md:p-8">
        <div className="relative max-w-sm mb-5">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, email, or phone"
            className="w-full rounded-lg border border-border bg-white py-2 pl-9 pr-3 text-sm focus:border-brand focus:outline-none"
          />
        </div>

        {isLoading ? (
          <LoadingSpinner label="Loading customers" />
        ) : !data?.items?.length ? (
          <EmptyState title="No customers found" />
        ) : (
          <>
            <DataTable columns={["ID", "Name", "Contact", "Orders", "Lifetime Spend", "Last Purchase", "Joined"]}>
              {data.items.map((c) => (
                <tr key={c.id} className="hover:bg-surface/40 transition-colors">
                  <td className="px-4 py-3 text-xs font-mono text-muted">#{c.id}</td>
                  <td className="px-4 py-3 text-sm font-medium text-ink whitespace-nowrap">{c.name}</td>
                  <td className="px-4 py-3 text-sm text-muted whitespace-nowrap">
                    {c.email}
                    {c.mobile_number && <span className="block text-xs">{c.mobile_number}</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-ink">{c.total_orders}</td>
                  <td className="px-4 py-3 text-sm font-medium text-ink whitespace-nowrap">{formatINR(c.lifetime_spend)}</td>
                  <td className="px-4 py-3 text-sm text-muted whitespace-nowrap">{c.last_purchase ? formatDate(c.last_purchase) : "—"}</td>
                  <td className="px-4 py-3 text-sm text-muted whitespace-nowrap">{formatDate(c.created_at)}</td>
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
