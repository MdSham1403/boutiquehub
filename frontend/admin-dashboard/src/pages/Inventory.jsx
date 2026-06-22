import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listInventory, getLowStock, getOutOfStock, updateVariant } from "../api/inventory";
import Topbar from "../components/layout/Topbar";
import DataTable from "../components/common/DataTable";
import Badge from "../components/common/Badge";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";

const TABS = [
  { key: "all", label: "All Stock" },
  { key: "low", label: "Low Stock" },
  { key: "out", label: "Out of Stock" },
];

function StockEditor({ item, onSave }) {
  const [value, setValue] = useState(item.stock);
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <button onClick={() => setEditing(true)} className="text-sm text-ink hover:text-brand underline-offset-2 hover:underline">
        {item.stock}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-20 rounded border border-border px-2 py-1 text-sm focus:border-brand focus:outline-none"
        autoFocus
      />
      <button
        onClick={() => { onSave(Number(value)); setEditing(false); }}
        className="text-xs font-medium text-brand"
      >
        Save
      </button>
      <button onClick={() => { setValue(item.stock); setEditing(false); }} className="text-xs text-muted">
        Cancel
      </button>
    </div>
  );
}

export default function Inventory() {
  const { openMobileMenu } = useOutletContext();
  const [tab, setTab] = useState("all");
  const queryClient = useQueryClient();

  const queryFn = { all: listInventory, low: getLowStock, out: getOutOfStock }[tab];

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["inventory", tab],
    queryFn: () => queryFn(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ variantId, stock }) => updateVariant(variantId, { stock }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });

  return (
    <div>
      <Topbar title="Inventory" onMenuClick={openMobileMenu} />

      <div className="p-4 md:p-8">
        <div className="flex gap-2 mb-5 border-b border-border">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? "border-brand text-brand" : "border-transparent text-muted hover:text-ink"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <LoadingSpinner label="Loading inventory" />
        ) : !items.length ? (
          <EmptyState title="Nothing here" description={tab === "out" ? "No out-of-stock variants." : tab === "low" ? "No low-stock variants." : "No inventory yet."} />
        ) : (
          <DataTable columns={["Product", "SKU", "Color", "Size", "Stock"]}>
            {items.map((item) => (
              <tr key={item.variant_id} className="hover:bg-surface/40 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-ink">{item.product_name}</td>
                <td className="px-4 py-3 text-sm text-muted">{item.sku}</td>
                <td className="px-4 py-3 text-sm text-ink">{item.color}</td>
                <td className="px-4 py-3 text-sm text-ink">{item.size}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <StockEditor item={item} onSave={(stock) => updateMutation.mutate({ variantId: item.variant_id, stock })} />
                    {item.stock === 0 && <Badge variant="danger">Out</Badge>}
                    {item.stock > 0 && item.stock <= 5 && <Badge variant="warning">Low</Badge>}
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </div>
    </div>
  );
}
