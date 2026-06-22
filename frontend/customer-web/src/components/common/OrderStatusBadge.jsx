const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700",
  payment_verification: "bg-blue-50 text-blue-700",
  confirmed: "bg-emerald-50 text-emerald-700",
  packing: "bg-purple-50 text-purple-700",
  shipped: "bg-sky-50 text-sky-700",
  out_for_delivery: "bg-indigo-50 text-indigo-700",
  delivered: "bg-sage/10 text-sage",
  cancelled: "bg-clay/10 text-clay",
  returned: "bg-taupe/10 text-taupe",
};

const STATUS_LABEL = {
  pending: "Pending",
  payment_verification: "Verifying Payment",
  confirmed: "Confirmed",
  packing: "Packing",
  shipped: "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

export default function OrderStatusBadge({ status }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status] || "bg-cream text-taupe"}`}>
      {STATUS_LABEL[status] || status}
    </span>
  );
}
