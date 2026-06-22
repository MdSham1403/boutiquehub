import { useOutletContext, useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FileText, CheckCircle, XCircle, Ban } from "lucide-react";
import { getAdminOrder, updateOrderStatus, verifyPayment, cancelOrder, getAdminInvoice } from "../api/orders";
import Topbar from "../components/layout/Topbar";
import OrderStatusBadge from "../components/common/OrderStatusBadge";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ConfirmDialog from "../components/common/ConfirmDialog";
import { formatINR, formatDateTime } from "../utils/format";
import { useState } from "react";

const STATUS_FLOW = [
  "pending", "payment_verification", "confirmed", "packing",
  "shipped", "out_for_delivery", "delivered",
];

const STATUS_LABEL = {
  pending: "Pending", payment_verification: "Verifying Payment", confirmed: "Confirmed",
  packing: "Packing", shipped: "Shipped", out_for_delivery: "Out for Delivery",
  delivered: "Delivered", cancelled: "Cancelled", returned: "Returned",
};

export default function OrderDetail() {
  const { openMobileMenu } = useOutletContext();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmCancel, setConfirmCancel] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ["admin-order", id],
    queryFn: () => getAdminOrder(id),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-order", id] });
    queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
  };

  const statusMutation = useMutation({ mutationFn: (status) => updateOrderStatus(id, status), onSuccess: invalidate });
  const verifyMutation = useMutation({ mutationFn: (verified) => verifyPayment(id, verified), onSuccess: invalidate });
  const cancelMutation = useMutation({ mutationFn: () => cancelOrder(id), onSuccess: () => { invalidate(); setConfirmCancel(false); } });

  const handleInvoice = async () => {
    const res = await getAdminInvoice(id);
    window.open(res.invoice_url, "_blank");
  };

  if (isLoading) return <LoadingSpinner label="Loading order" />;
  if (!order) return null;

  const isFinal = ["cancelled", "returned"].includes(order.status);

  return (
    <div>
      <Topbar
        title={`Order ${order.order_number}`}
        onMenuClick={openMobileMenu}
        actions={
          <button onClick={handleInvoice} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-ink hover:border-brand transition-colors">
            <FileText size={16} /> Invoice
          </button>
        }
      />

      <div className="p-4 md:p-8 max-w-4xl">
        <button onClick={() => navigate("/orders")} className="flex items-center gap-1.5 text-sm text-muted hover:text-brand mb-5">
          <ArrowLeft size={16} /> Back to Orders
        </button>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-base text-ink">Items</h3>
                <OrderStatusBadge status={order.status} />
              </div>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div>
                      <p className="font-medium text-ink">{item.product_name}</p>
                      <p className="text-muted text-xs">{item.color} · {item.size} · Qty {item.quantity}</p>
                    </div>
                    <span className="font-medium text-ink">{formatINR(item.total_price)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-border flex justify-between font-semibold text-ink">
                <span>Total</span>
                <span className="font-display text-lg">{formatINR(order.total)}</span>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-white p-6">
              <h3 className="font-display text-base text-ink mb-3">Delivery Address</h3>
              <p className="text-sm text-muted leading-relaxed">
                {order.address.house_no}, {order.address.street}, {order.address.area}<br />
                {order.address.city}, {order.address.district} — {order.address.pincode}<br />
                {order.address.state}
                {order.address.landmark && <><br />Landmark: {order.address.landmark}</>}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-white p-6">
              <h3 className="font-display text-base text-ink mb-3">Payment</h3>
              <p className="text-sm text-ink mb-1">
                Method: <span className="font-medium">{order.payment_method === "cod" ? "Cash on Delivery" : "UPI / Scan & Pay"}</span>
              </p>
              <p className="text-sm text-ink mb-3">
                Status: <span className="font-medium capitalize">{order.payment_status.replace(/_/g, " ")}</span>
              </p>

              {order.payment_screenshot_url && (
                <div className="mb-3">
                  <p className="text-xs text-muted mb-1.5">Payment Screenshot</p>
                  <a href={order.payment_screenshot_url} target="_blank" rel="noopener noreferrer">
                    <img src={order.payment_screenshot_url} alt="Payment proof" className="max-h-64 rounded-lg border border-border" />
                  </a>
                </div>
              )}

              {order.payment_method === "scan_and_pay" && order.payment_status === "verification_pending" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => verifyMutation.mutate(true)}
                    className="flex items-center gap-1.5 rounded-lg bg-sage px-4 py-2 text-sm font-semibold text-white hover:bg-sage/90 transition-colors"
                  >
                    <CheckCircle size={16} /> Verify Payment
                  </button>
                  <button
                    onClick={() => verifyMutation.mutate(false)}
                    className="flex items-center gap-1.5 rounded-lg border border-clay text-clay px-4 py-2 text-sm font-semibold hover:bg-clay/5 transition-colors"
                  >
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-white p-5">
              <h3 className="font-display text-base text-ink mb-3">Update Status</h3>
              {isFinal ? (
                <p className="text-sm text-muted">This order is {STATUS_LABEL[order.status].toLowerCase()} and can't be progressed further.</p>
              ) : (
                <div className="space-y-1.5">
                  {STATUS_FLOW.map((s) => (
                    <button
                      key={s}
                      onClick={() => statusMutation.mutate(s)}
                      disabled={order.status === s}
                      className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${order.status === s ? "bg-brand text-white font-medium" : "text-ink hover:bg-surface"}`}
                    >
                      {STATUS_LABEL[s]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {!isFinal && (
              <button
                onClick={() => setConfirmCancel(true)}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-clay text-clay py-2.5 text-sm font-semibold hover:bg-clay/5 transition-colors"
              >
                <Ban size={16} /> Cancel Order
              </button>
            )}

            <div className="rounded-xl border border-border bg-white p-5 text-sm text-muted">
              <p>Placed: {formatDateTime(order.created_at)}</p>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        title="Cancel this order?"
        description="Stock will be restored for all items in this order. This can't be undone."
        confirmLabel="Cancel Order"
        danger
        onConfirm={() => cancelMutation.mutate()}
        onCancel={() => setConfirmCancel(false)}
      />
    </div>
  );
}
