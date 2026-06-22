import { useState } from "react";
import { useOutletContext, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Copy, Archive, ArchiveRestore, Edit2, Trash2 } from "lucide-react";
import { listAdminProducts, deleteProduct, toggleArchiveProduct, toggleActiveProduct, duplicateProduct } from "../api/products";
import { getCategories } from "../api/categories";
import Topbar from "../components/layout/Topbar";
import DataTable from "../components/common/DataTable";
import Pagination from "../components/common/Pagination";
import Toggle from "../components/common/Toggle";
import Badge from "../components/common/Badge";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";
import ConfirmDialog from "../components/common/ConfirmDialog";
import { useDebounce } from "../hooks/useDebounce";
import { formatINR, formatApiError } from "../utils/format";

export default function Products() {
  const { openMobileMenu } = useOutletContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionError, setActionError] = useState("");

  const debouncedSearch = useDebounce(search);

  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: () => getCategories(true) });

  const { data, isLoading, error: listError } = useQuery({
    queryKey: ["admin-products", debouncedSearch, categoryId, includeArchived, page],
    queryFn: () => listAdminProducts({
      search: debouncedSearch || undefined,
      category_id: categoryId || undefined,
      include_archived: includeArchived,
      page, page_size: 20,
    }),
    keepPreviousData: true,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-products"] });
  const onActionError = (err) => setActionError(formatApiError(err));

  const archiveMutation = useMutation({
    mutationFn: ({ id, archived }) => toggleArchiveProduct(id, archived),
    onSuccess: invalidate,
    onError: onActionError,
  });
  const activeMutation = useMutation({
    mutationFn: ({ id, active }) => toggleActiveProduct(id, active),
    onSuccess: invalidate,
    onError: onActionError,
  });
  const duplicateMutation = useMutation({ mutationFn: duplicateProduct, onSuccess: invalidate, onError: onActionError });
  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => { invalidate(); setDeleteTarget(null); },
    onError: onActionError,
  });

  return (
    <div>
      <Topbar
        title="Products"
        onMenuClick={openMobileMenu}
        actions={
          <Link to="/products/new" className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark transition-colors">
            <Plus size={16} /> Add Product
          </Link>
        }
      />

      <div className="p-4 md:p-8">
        {actionError && (
          <div className="mb-4 flex items-start justify-between gap-3 rounded-lg bg-clay/10 px-4 py-3 text-sm text-clay">
            <span>{actionError}</span>
            <button onClick={() => setActionError("")} className="shrink-0 font-medium hover:underline">Dismiss</button>
          </div>
        )}
        {listError && (
          <div className="mb-4 rounded-lg bg-clay/10 px-4 py-3 text-sm text-clay">
            {formatApiError(listError)}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search products..."
              className="w-full rounded-lg border border-border bg-white py-2 pl-9 pr-3 text-sm focus:border-brand focus:outline-none"
            />
          </div>
          <select
            value={categoryId}
            onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <Toggle checked={includeArchived} onChange={(v) => { setIncludeArchived(v); setPage(1); }} label="Show archived" />
        </div>

        {isLoading ? (
          <LoadingSpinner label="Loading products" />
        ) : !data?.items?.length ? (
          <EmptyState title="No products found" description="Try adjusting your search or add a new product." />
        ) : (
          <>
            <DataTable columns={["Product", "Category", "Price", "Stock", "Status", ""]}>
              {data.items.map((p) => (
                <tr key={p.id} className="hover:bg-surface/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.primary_image
                        ? <img src={p.primary_image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                        : <div className="h-10 w-10 rounded-lg bg-surface" />
                      }
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink truncate max-w-[200px]">{p.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted whitespace-nowrap">{p.category?.name || "—"}</td>
                  <td className="px-4 py-3 text-sm text-ink whitespace-nowrap">
                    {formatINR(p.offer_price || p.price)}
                    {p.offer_price && <span className="text-muted line-through ml-1.5 text-xs">{formatINR(p.price)}</span>}
                  </td>
                  <td className="px-4 py-3 text-sm whitespace-nowrap">
                    {p.total_stock === 0
                      ? <Badge variant="danger">Out of stock</Badge>
                      : p.total_stock <= 5
                        ? <Badge variant="warning">{p.total_stock} left</Badge>
                        : <span className="text-ink">{p.total_stock}</span>
                    }
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {p.is_archived
                      ? <Badge variant="default">Archived</Badge>
                      : <Toggle checked={p.is_active} onChange={(v) => activeMutation.mutate({ id: p.id, active: v })} />
                    }
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => navigate(`/products/${p.id}`)} className="text-muted hover:text-brand transition-colors" title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => duplicateMutation.mutate(p.id)} className="text-muted hover:text-brand transition-colors" title="Duplicate">
                        <Copy size={16} />
                      </button>
                      <button
                        onClick={() => archiveMutation.mutate({ id: p.id, archived: !p.is_archived })}
                        className="text-muted hover:text-brand transition-colors"
                        title={p.is_archived ? "Unarchive" : "Archive"}
                      >
                        {p.is_archived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
                      </button>
                      <button onClick={() => setDeleteTarget(p)} className="text-muted hover:text-clay transition-colors" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </DataTable>
            <Pagination page={page} totalPages={data.total_pages} onChange={setPage} />
          </>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this product?"
        description={`"${deleteTarget?.name}" will be permanently removed. This can't be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
