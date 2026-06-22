import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { listStaff, createStaff, updateStaff, deleteStaff } from "../api/staff";
import { useAuth } from "../context/AuthContext";
import Topbar from "../components/layout/Topbar";
import Toggle from "../components/common/Toggle";
import Badge from "../components/common/Badge";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ConfirmDialog from "../components/common/ConfirmDialog";

const ROLES = [
  ["super_admin", "Super Admin"],
  ["admin", "Admin"],
  ["order_manager", "Order Manager"],
  ["packing_staff", "Packing Staff"],
  ["delivery_staff", "Delivery Staff"],
  ["customer_support", "Customer Support"],
];

export default function Staff() {
  const { openMobileMenu } = useOutletContext();
  const { admin: me } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { register, handleSubmit, reset } = useForm();

  const { data: staff = [], isLoading } = useQuery({ queryKey: ["staff"], queryFn: listStaff });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["staff"] });
  const createMutation = useMutation({
    mutationFn: createStaff,
    onSuccess: () => { invalidate(); setShowForm(false); reset(); setError(""); },
    onError: (err) => setError(err.response?.data?.detail || "Failed to create account."),
  });
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => updateStaff(id, data), onSuccess: invalidate });
  const deleteMutation = useMutation({ mutationFn: deleteStaff, onSuccess: () => { invalidate(); setDeleteTarget(null); } });

  return (
    <div>
      <Topbar
        title="Staff Accounts"
        onMenuClick={openMobileMenu}
        actions={
          <button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark transition-colors">
            <Plus size={16} /> Add Staff
          </button>
        }
      />

      <div className="p-4 md:p-8 max-w-3xl">
        <p className="text-sm text-muted mb-5">
          As Super Admin, you control who can access the dashboard and what they can do.
          Each role sees a different set of pages.
        </p>

        {showForm && (
          <div className="rounded-xl border border-border bg-white p-6 mb-6">
            <h3 className="font-display text-base text-ink mb-4">New Staff Account</h3>
            <form
              onSubmit={handleSubmit((data) => createMutation.mutate(data))}
              className="grid gap-4 sm:grid-cols-2"
            >
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Full Name</label>
                <input {...register("full_name", { required: true })} className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Email</label>
                <input {...register("email", { required: true })} type="email" className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Temporary Password</label>
                <input {...register("password", { required: true, minLength: 8 })} type="password" className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
                <p className="text-xs text-muted mt-0.5">At least 8 characters. Share this with them securely.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Role</label>
                <select {...register("role", { required: true })} className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none">
                  {ROLES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
              {error && <p className="sm:col-span-2 text-sm text-clay">{error}</p>}
              <div className="sm:col-span-2 flex gap-3">
                <button type="submit" disabled={createMutation.isPending} className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50 transition-colors">
                  {createMutation.isPending ? "Creating..." : "Create Account"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-ink hover:bg-surface transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {isLoading ? (
          <LoadingSpinner label="Loading staff" />
        ) : (
          <div className="space-y-3">
            {staff.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-white p-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{s.full_name} {s.id === me?.id && <span className="text-xs text-muted">(you)</span>}</p>
                  <p className="text-xs text-muted truncate">{s.email}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <select
                    value={s.role}
                    onChange={(e) => updateMutation.mutate({ id: s.id, data: { role: e.target.value } })}
                    disabled={s.id === me?.id}
                    className="rounded-lg border border-border px-2 py-1.5 text-xs focus:border-brand focus:outline-none disabled:opacity-50"
                  >
                    {ROLES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                  {s.is_active ? <Badge variant="success">Active</Badge> : <Badge variant="danger">Disabled</Badge>}
                  <Toggle
                    checked={s.is_active}
                    onChange={(v) => updateMutation.mutate({ id: s.id, data: { is_active: v } })}
                    disabled={s.id === me?.id}
                  />
                  <button
                    onClick={() => setDeleteTarget(s)}
                    disabled={s.id === me?.id}
                    className="text-muted hover:text-clay disabled:opacity-30 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Remove ${deleteTarget?.full_name}?`}
        description="They will lose all dashboard access immediately."
        confirmLabel="Remove Access"
        danger
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
