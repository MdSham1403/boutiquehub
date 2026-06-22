import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getMyOrders } from "../../api/orders";
import { formatINR } from "../../utils/formatCurrency";
import OrderStatusBadge from "../../components/common/OrderStatusBadge";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";

export default function Orders() {
  const { data: orders = [], isLoading } = useQuery({ queryKey: ["my-orders"], queryFn: getMyOrders });

  if (isLoading) return <LoadingSpinner label="Loading orders" />;
  if (!orders.length) return (
    <EmptyState
      title="No orders yet"
      description="Start shopping to see your orders here."
      action={<Link to="/search" className="inline-block rounded-full bg-rose px-6 py-2.5 text-sm font-semibold text-white hover:bg-rose-dark">Browse Products</Link>}
    />
  );

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl text-espresso mb-2">My Orders</h2>
      {orders.map((order) => (
        <Link
          key={order.id}
          to={`/account/orders/${order.id}`}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-card hover:shadow-lift transition-shadow"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-espresso text-sm">{order.order_number}</span>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="text-xs text-taupe">
              {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              {" · "}
              {order.payment_method === "cod" ? "COD" : "Paid via UPI"}
            </p>
          </div>
          <span className="font-semibold text-espresso shrink-0">{formatINR(order.total)}</span>
        </Link>
      ))}
    </div>
  );
}
