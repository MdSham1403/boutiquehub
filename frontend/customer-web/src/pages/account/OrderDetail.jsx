import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FileText, ArrowLeft } from "lucide-react";
import { getMyOrder, getMyInvoice } from "../../api/orders";
import { formatINR } from "../../utils/formatCurrency";
import OrderStatusBadge from "../../components/common/OrderStatusBadge";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import StitchDivider from "../../components/common/StitchDivider";

const STATUS_STEPS = [
  "pending", "payment_verification", "confirmed",
  "packing", "shipped", "out_for_delivery", "delivered"
];

const STEP_LABEL = {
  pending: "Order Placed",
  payment_verification: "Verifying Payment",
  confirmed: "Confirmed",
  packing: "Packing",
  shipped: "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
};

function OrderTracker({ status }) {
  const currentIndex = STATUS_STEPS.indexOf(status);
  if (currentIndex === -1) return null;

  return (
    <div className="overflow-x-auto no-scrollbar py-2">
      <div className="flex items-center gap-0 min-w-[520px]">
        {STATUS_STEPS.map((step, i) => {
          const done = i <= currentIndex;
          const active = i === currentIndex;
          return (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center shrink-0">
                <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center text-[10px] font-semibold transition-colors ${done ? "bg-rose border-rose text-white" : "border-cream text-taupe"} ${active ? "ring-2 ring-rose/30" : ""}`}>
                  {i + 1}
                </div>
                <span className={`mt-1 text-[9px] text-center max-w-[52px] leading-tight ${done ? "text-rose font-medium" : "text-taupe"}`}>{STEP_LABEL[step]}</span>
              </div>
              {i < STATUS_STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mb-3 mx-0.5 ${i < currentIndex ? "bg-rose" : "bg-cream"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function OrderDetail() {
  const { orderId } = useParams();

  const { data: order, isLoading } = useQuery({
    queryKey: ["my-order", orderId],
    queryFn: () => getMyOrder(orderId),
  });

  const handleDownloadInvoice = async () => {
    try {
      const res = await getMyInvoice(orderId);
      window.open(res.invoice_url, "_blank");
    } catch {
      alert("Invoice not available yet. Please try again shortly.");
    }
  };

  if (isLoading) return <LoadingSpinner label="Loading order" />;
  if (!order) return <div className="text-center text-taupe py-12">Order not found.</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link to="/account/orders" className="flex items-center gap-1.5 text-sm text-taupe hover:text-rose">
          <ArrowLeft size={16} /> Back to Orders
        </Link>
        <button onClick={handleDownloadInvoice} className="flex items-center gap-1.5 text-sm text-rose hover:underline font-medium">
          <FileText size={16} /> Download Invoice
        </button>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="font-display text-xl text-espresso">{order.order_number}</h2>
            <p className="text-xs text-taupe">
              {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        {["cancelled", "returned"].indexOf(order.status) === -1 && (
          <>
            <OrderTracker status={order.status} />
            <StitchDivider className="my-5" />
          </>
        )}

        {/* Items */}
        <h3 className="font-semibold text-espresso text-sm mb-3">Items</h3>
        <div className="space-y-3 mb-5">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <div>
                <p className="font-medium text-espresso">{item.product_name}</p>
                <p className="text-taupe text-xs">{item.color} · {item.size} · Qty {item.quantity}</p>
              </div>
              <span className="font-medium">{formatINR(item.total_price)}</span>
            </div>
          ))}
        </div>

        <StitchDivider className="mb-4" />

        <div className="flex justify-between font-semibold text-espresso">
          <span>Total</span>
          <span className="font-display text-xl">{formatINR(order.total)}</span>
        </div>

        {/* Address */}
        <div className="mt-5 rounded-xl bg-cream p-4 text-sm">
          <p className="font-semibold text-espresso mb-1">Delivery Address</p>
          <p className="text-taupe">
            {order.address.house_no}, {order.address.street}, {order.address.area}<br />
            {order.address.city}, {order.address.district} — {order.address.pincode}<br />
            {order.address.state}
            {order.address.landmark && <><br />{order.address.landmark}</>}
          </p>
        </div>

        <p className="mt-3 text-xs text-taupe">
          Payment: {order.payment_method === "cod" ? "Cash on Delivery" : "UPI / Scan & Pay"}
          {order.payment_status === "verified" && " ✅ Verified"}
          {order.payment_status === "verification_pending" && " ⏳ Pending verification"}
        </p>
      </div>
    </div>
  );
}
