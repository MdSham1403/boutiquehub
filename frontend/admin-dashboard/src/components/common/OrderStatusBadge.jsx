import Badge from "./Badge";

const STATUS_VARIANT = {
  pending: "warning",
  payment_verification: "brand",
  confirmed: "success",
  packing: "brand",
  shipped: "brand",
  out_for_delivery: "brand",
  delivered: "success",
  cancelled: "danger",
  returned: "default",
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
  return <Badge variant={STATUS_VARIANT[status] || "default"}>{STATUS_LABEL[status] || status}</Badge>;
}
