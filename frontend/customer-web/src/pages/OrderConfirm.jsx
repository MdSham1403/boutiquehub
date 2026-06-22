import { useLocation, Link } from "react-router-dom";
import { CheckCircle, MessageCircle, Package } from "lucide-react";
import { formatINR } from "../utils/formatCurrency";
import StitchDivider from "../components/common/StitchDivider";

export default function OrderConfirm() {
  const { state } = useLocation();
  const { order, whatsapp_link } = state || {};

  if (!order) {
    return (
      <main className="py-20 text-center">
        <p className="text-taupe">No order details found.</p>
        <Link to="/" className="mt-4 inline-block text-rose hover:underline">Go home</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-12 md:px-8">
      <div className="rounded-2xl bg-white p-8 shadow-card text-center">
        <CheckCircle size={48} className="mx-auto text-sage mb-3" />
        <h1 className="font-display text-3xl text-espresso mb-1">Order Placed!</h1>
        <p className="text-taupe text-sm mb-6">
          Order <span className="font-semibold text-espresso">{order.order_number}</span>
        </p>

        <StitchDivider className="mb-6" />

        {/* Items */}
        <div className="text-left space-y-2 mb-5">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-espresso">{item.product_name} <span className="text-taupe">× {item.quantity}</span></span>
              <span className="font-medium">{formatINR(item.total_price)}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-between font-semibold text-espresso mb-6">
          <span>Total Paid</span>
          <span className="font-display text-xl">{formatINR(order.total)}</span>
        </div>

        <div className="rounded-xl bg-cream p-4 text-sm text-left mb-6">
          <p className="font-medium text-espresso mb-1">Delivery to</p>
          <p className="text-taupe">
            {order.address.house_no}, {order.address.street}, {order.address.area}<br />
            {order.address.city} — {order.address.pincode}
          </p>
        </div>

        {/* WhatsApp CTA — the core integration */}
        <a
          href={whatsapp_link}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] py-3.5 text-sm font-semibold text-white hover:bg-[#1ebe5d] transition-colors"
        >
          <MessageCircle size={18} />
          Continue to WhatsApp to Confirm
        </a>
        <p className="text-xs text-taupe mb-6">
          Tap to open WhatsApp with your order details pre-filled. Just press Send!
        </p>

        {order.payment_method === "scan_and_pay" && (
          <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-700 text-left">
            Your payment screenshot is being verified. You'll receive a confirmation once done.
          </div>
        )}

        <div className="flex gap-3">
          <Link
            to="/account/orders"
            className="flex-1 flex items-center justify-center gap-1.5 rounded-full border border-cream py-3 text-sm font-semibold text-espresso hover:border-rose transition-colors"
          >
            <Package size={16} /> My Orders
          </Link>
          <Link
            to="/search"
            className="flex-1 rounded-full bg-rose py-3 text-sm font-semibold text-white text-center hover:bg-rose-dark transition-colors"
          >
            Shop More
          </Link>
        </div>
      </div>
    </main>
  );
}
