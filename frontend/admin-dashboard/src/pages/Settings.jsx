import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Upload, Send } from "lucide-react";
import { getStoreSettings, updateStoreSettings, uploadUpiQr, uploadStoreLogo } from "../api/settings";
import { sendTestNotification, triggerDailySummary } from "../api/notifications";
import { changePassword } from "../api/auth";
import Topbar from "../components/layout/Topbar";
import LoadingSpinner from "../components/common/LoadingSpinner";

export default function Settings() {
  const { openMobileMenu } = useOutletContext();
  const queryClient = useQueryClient();
  const [testStatus, setTestStatus] = useState("");
  const [pwStatus, setPwStatus] = useState("");
  const [pwError, setPwError] = useState("");

  const { data: settings, isLoading } = useQuery({ queryKey: ["store-settings"], queryFn: getStoreSettings });
  const { register, handleSubmit, reset } = useForm();
  const { register: registerPw, handleSubmit: handleSubmitPw, reset: resetPw } = useForm();

  useEffect(() => {
    if (settings) reset({ store_name: settings.store_name || "", upi_id: settings.upi_id || "" });
  }, [settings]);

  const onChangePassword = async ({ current_password, new_password, confirm_password }) => {
    setPwError("");
    setPwStatus("");
    if (new_password !== confirm_password) {
      setPwError("New passwords don't match.");
      return;
    }
    try {
      await changePassword(current_password, new_password);
      setPwStatus("Password updated successfully.");
      resetPw();
    } catch (err) {
      setPwError(err.response?.data?.detail || "Failed to update password.");
    }
  };

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["store-settings"] });
  const updateMutation = useMutation({ mutationFn: updateStoreSettings, onSuccess: invalidate });
  const qrMutation = useMutation({ mutationFn: uploadUpiQr, onSuccess: invalidate });
  const logoMutation = useMutation({ mutationFn: uploadStoreLogo, onSuccess: invalidate });

  const handleTestNotification = async () => {
    setTestStatus("sending");
    try {
      const res = await sendTestNotification();
      setTestStatus(res.sent ? "sent" : "not-configured");
    } catch {
      setTestStatus("error");
    }
  };

  if (isLoading) return <LoadingSpinner label="Loading settings" />;

  return (
    <div>
      <Topbar title="Settings" onMenuClick={openMobileMenu} />

      <div className="p-4 md:p-8 max-w-2xl space-y-6">
        <div className="rounded-xl border border-border bg-white p-6">
          <h3 className="font-display text-base text-ink mb-4">Change Password</h3>
          <form onSubmit={handleSubmitPw(onChangePassword)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Current Password</label>
              <input {...registerPw("current_password", { required: true })} type="password" className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">New Password</label>
              <input {...registerPw("new_password", { required: true, minLength: 8 })} type="password" className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
              <p className="text-xs text-muted mt-0.5">At least 8 characters.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Confirm New Password</label>
              <input {...registerPw("confirm_password", { required: true })} type="password" className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
            </div>
            {pwError && <p className="text-sm text-clay">{pwError}</p>}
            {pwStatus && <p className="text-sm text-sage">{pwStatus}</p>}
            <button type="submit" className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark transition-colors">
              Update Password
            </button>
          </form>
          <p className="text-xs text-muted mt-4 pt-4 border-t border-border">
            Locked out and can't log in at all? Run this on the backend instead:<br />
            <code className="bg-surface px-1.5 py-0.5 rounded mt-1 inline-block">python -m app.reset_admin_password you@email.com NewPassword123</code>
          </p>
        </div>

        <div className="rounded-xl border border-border bg-white p-6">
          <h3 className="font-display text-base text-ink mb-4">Store Information</h3>
          <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Store Name</label>
              <input {...register("store_name")} placeholder="Glam Closet" className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">UPI ID</label>
              <input {...register("upi_id")} placeholder="yourstore@upi" className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
            </div>
            <button type="submit" disabled={updateMutation.isPending} className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50 transition-colors">
              {updateMutation.isPending ? "Saving..." : "Save"}
            </button>
            {updateMutation.isSuccess && <span className="ml-3 text-sm text-sage">Saved!</span>}
          </form>
        </div>

        <div className="rounded-xl border border-border bg-white p-6">
          <h3 className="font-display text-base text-ink mb-3">Store Logo</h3>
          <p className="text-xs text-muted mb-3">Shown on invoices.</p>
          {settings?.store_logo_url && <img src={settings.store_logo_url} alt="Store logo" className="h-16 mb-3 rounded-lg border border-border" />}
          <label className="flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2.5 cursor-pointer hover:border-brand transition-colors w-fit">
            <Upload size={16} className="text-muted" />
            <span className="text-sm text-muted">{logoMutation.isPending ? "Uploading..." : "Upload logo"}</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && logoMutation.mutate(e.target.files[0])} />
          </label>
        </div>

        <div className="rounded-xl border border-border bg-white p-6">
          <h3 className="font-display text-base text-ink mb-3">UPI QR Code</h3>
          <p className="text-xs text-muted mb-3">Shown to customers at checkout for Scan & Pay.</p>
          {settings?.upi_qr_code_url && <img src={settings.upi_qr_code_url} alt="UPI QR" className="h-40 w-40 mb-3 rounded-lg border border-border" />}
          <label className="flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2.5 cursor-pointer hover:border-brand transition-colors w-fit">
            <Upload size={16} className="text-muted" />
            <span className="text-sm text-muted">{qrMutation.isPending ? "Uploading..." : "Upload QR code"}</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && qrMutation.mutate(e.target.files[0])} />
          </label>
        </div>

        <div className="rounded-xl border border-border bg-white p-6">
          <h3 className="font-display text-base text-ink mb-2">Telegram Notifications</h3>
          <p className="text-xs text-muted mb-4">
            Set <code className="bg-surface px-1 rounded">TELEGRAM_BOT_TOKEN</code> and{" "}
            <code className="bg-surface px-1 rounded">TELEGRAM_CHAT_ID</code> in the backend's <code className="bg-surface px-1 rounded">.env</code>, then test below.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={handleTestNotification} className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink hover:border-brand transition-colors">
              <Send size={14} /> Send Test Message
            </button>
            <button onClick={() => triggerDailySummary()} className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink hover:border-brand transition-colors">
              Send Daily Summary Now
            </button>
            {testStatus === "sent" && <span className="text-sm text-sage">✅ Sent! Check Telegram.</span>}
            {testStatus === "not-configured" && <span className="text-sm text-clay">Telegram isn't configured yet.</span>}
            {testStatus === "error" && <span className="text-sm text-clay">Something went wrong.</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
