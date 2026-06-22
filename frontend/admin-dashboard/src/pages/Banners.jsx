import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Upload } from "lucide-react";
import { listBanners, createBanner, updateBanner, deleteBanner, uploadBannerImage } from "../api/banners";
import Topbar from "../components/layout/Topbar";
import Toggle from "../components/common/Toggle";
import Badge from "../components/common/Badge";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";
import ConfirmDialog from "../components/common/ConfirmDialog";

const TYPES = [
  { value: "home", label: "Home" },
  { value: "sale", label: "Sale" },
  { value: "festival", label: "Festival" },
];

export default function Banners() {
  const { openMobileMenu } = useOutletContext();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [newType, setNewType] = useState("home");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: banners = [], isLoading } = useQuery({ queryKey: ["banners"], queryFn: () => listBanners({}) });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["banners"] });
  const createMutation = useMutation({ mutationFn: createBanner, onSuccess: invalidate });
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => updateBanner(id, data), onSuccess: invalidate });
  const deleteMutation = useMutation({ mutationFn: deleteBanner, onSuccess: () => { invalidate(); setDeleteTarget(null); } });

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadBannerImage(file);
      await createMutation.mutateAsync({ banner_type: newType, image_url: url, display_order: banners.length });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <Topbar title="Banners" onMenuClick={openMobileMenu} />

      <div className="p-4 md:p-8">
        <div className="rounded-xl border border-border bg-white p-5 mb-6">
          <h3 className="font-display text-base text-ink mb-3">Upload New Banner</h3>
          <div className="flex flex-wrap items-center gap-3">
            <select value={newType} onChange={(e) => setNewType(e.target.value)} className="rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none">
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label} Banner</option>)}
            </select>
            <label className="flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2 cursor-pointer hover:border-brand transition-colors">
              <Upload size={16} className="text-muted" />
              <span className="text-sm text-muted">{uploading ? "Uploading..." : "Choose image"}</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e.target.files[0])} />
            </label>
          </div>
          <p className="text-xs text-muted mt-2">Recommended: 1600×600px for Home, 1200×400px for Sale/Festival banners.</p>
        </div>

        {isLoading ? (
          <LoadingSpinner label="Loading banners" />
        ) : !banners.length ? (
          <EmptyState title="No banners yet" description="Upload your first banner above." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {banners.map((b) => (
              <div key={b.id} className="rounded-xl border border-border bg-white overflow-hidden">
                <img src={b.image_url} alt="" className="w-full h-32 object-cover" />
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="brand">{TYPES.find((t) => t.value === b.banner_type)?.label}</Badge>
                    <Toggle checked={b.is_active} onChange={(v) => updateMutation.mutate({ id: b.id, data: { is_active: v } })} />
                  </div>
                  <button onClick={() => setDeleteTarget(b)} className="flex items-center gap-1 text-xs text-muted hover:text-clay transition-colors">
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this banner?"
        confirmLabel="Delete"
        danger
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
