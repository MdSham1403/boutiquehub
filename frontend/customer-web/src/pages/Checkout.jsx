import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CheckCircle, Upload } from "lucide-react";
import { previewCart } from "../api/cart";
import { getAddresses, createAddress } from "../api/customer";
import { getStoreSettings } from "../api/settings";
import { createOrder, uploadPaymentScreenshot } from "../api/orders";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import AddressForm from "../components/common/AddressForm";
import StitchDivider from "../components/common/StitchDivider";
import { formatINR } from "../utils/formatCurrency";

const STEPS = ["Address", "Payment", "Review & Place Order"];

function StepIndicator({ current }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors ${i < current ? "bg-rose border-rose text-white" : i === current ? "border-rose text-rose" : "border-cream text-taupe"}`}>
              {i < current ? <CheckCircle size={14} /> : i + 1}
            </div>
            <span className="mt-1 text-[10px] text-taupe hidden md:block">{label}</span>
          </div>
          {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-1 ${i < current ? "bg-rose" : "bg-cream"}`} />}
        </div>
      ))}
    </div>
  );
}

export default function Checkout() {
  const { items, clearCart } = useCart();
  const { customer, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) navigate("/login?next=/checkout");
    if (!items.length) navigate("/cart");
  }, [isLoggedIn, items.length]);

  const { data: preview } = useQuery({
    queryKey: ["cart-preview", items],
    queryFn: () => previewCart(items),
    enabled: items.length > 0,
  });

  const { data: addresses = [], refetch: refetchAddresses } = useQuery({
    queryKey: ["addresses"],
    queryFn: getAddresses,
    enabled: isLoggedIn,
  });

  const { data: storeSettings } = useQuery({
    queryKey: ["store-settings"],
    queryFn: getStoreSettings,
  });

  useEffect(() => {
    const def = addresses.find((a) => a.is_default) || addresses[0];
    if (def && !selectedAddressId) setSelectedAddressId(def.id);
  }, [addresses]);

  const addAddressMutation = useMutation({
    mutationFn: createAddress,
    onSuccess: (addr) => {
      setSelectedAddressId(addr.id);
      setShowNewAddress(false);
      refetchAddresses();
    },
  });

  const placeMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (data) => {
      clearCart();
      navigate("/order-confirm", { state: { order: data.order, whatsapp_link: data.whatsapp_link } });
    },
  });

  const handleScreenshotUpload = async (file) => {
    setUploading(true);
    try {
      const res = await uploadPaymentScreenshot(file);
      setScreenshotUrl(res.url);
    } finally {
      setUploading(false);
    }
  };

  const handlePlaceOrder = () => {
    const payload = {
      items,
      payment_method: paymentMethod,
      address_id: selectedAddressId,
      ...(paymentMethod === "scan_and_pay" && { payment_screenshot_url: screenshotUrl }),
    };
    placeMutation.mutate(payload);
  };

  const canProceedFromAddress = selectedAddressId || showNewAddress;
  const canProceedFromPayment = paymentMethod === "cod" || (paymentMethod === "scan_and_pay" && screenshotUrl);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 md:px-8">
      <h1 className="font-display text-3xl text-espresso mb-6">Checkout</h1>
      <StepIndicator current={step} />

      <div className="grid gap-8 md:grid-cols-[1fr_280px]">
        <div>
          {/* Step 0 – Address */}
          {step === 0 && (
            <div className="rounded-xl bg-white p-6 shadow-card">
              <h2 className="font-semibold text-espresso mb-4">Delivery Address</h2>
              {addresses.length > 0 && !showNewAddress && (
                <div className="space-y-3 mb-4">
                  {addresses.map((addr) => (
                    <label key={addr.id} className={`flex gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${selectedAddressId === addr.id ? "border-rose bg-rose/5" : "border-cream hover:border-rose/50"}`}>
                      <input
                        type="radio"
                        checked={selectedAddressId === addr.id}
                        onChange={() => setSelectedAddressId(addr.id)}
                        className="accent-rose mt-0.5"
                      />
                      <div className="text-sm text-espresso">
                        <p className="font-medium">{addr.house_no}, {addr.street}</p>
                        <p className="text-taupe">{addr.area}, {addr.city} — {addr.pincode}</p>
                        <p className="text-taupe">{addr.district}, {addr.state}</p>
                        {addr.landmark && <p className="text-taupe">{addr.landmark}</p>}
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {showNewAddress ? (
                <AddressForm
                  onSubmit={(data) => addAddressMutation.mutate(data)}
                  loading={addAddressMutation.isPending}
                  submitLabel="Save & Use This Address"
                />
              ) : (
                <button onClick={() => setShowNewAddress(true)} className="text-sm text-rose hover:underline">
                  + Add New Address
                </button>
              )}

              {!showNewAddress && (
                <button
                  onClick={() => setStep(1)}
                  disabled={!canProceedFromAddress}
                  className="mt-5 w-full rounded-full bg-rose py-3 text-sm font-semibold text-white hover:bg-rose-dark disabled:opacity-40 transition-colors"
                >
                  Continue to Payment
                </button>
              )}
            </div>
          )}

          {/* Step 1 – Payment */}
          {step === 1 && (
            <div className="rounded-xl bg-white p-6 shadow-card">
              <h2 className="font-semibold text-espresso mb-4">Payment Method</h2>

              <div className="space-y-3 mb-5">
                <label className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer ${paymentMethod === "cod" ? "border-rose bg-rose/5" : "border-cream"}`}>
                  <input type="radio" value="cod" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} className="accent-rose mt-0.5" />
                  <div>
                    <p className="font-medium text-espresso text-sm">Cash on Delivery</p>
                    <p className="text-xs text-taupe">Pay when your order arrives</p>
                  </div>
                </label>

                <label className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer ${paymentMethod === "scan_and_pay" ? "border-rose bg-rose/5" : "border-cream"}`}>
                  <input type="radio" value="scan_and_pay" checked={paymentMethod === "scan_and_pay"} onChange={() => setPaymentMethod("scan_and_pay")} className="accent-rose mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-espresso text-sm">Scan & Pay (UPI)</p>
                    <p className="text-xs text-taupe mb-3">Scan the QR code and upload your payment screenshot</p>

                    {paymentMethod === "scan_and_pay" && (
                      <>
                        {storeSettings?.upi_qr_code_url && (
                          <img src={storeSettings.upi_qr_code_url} alt="UPI QR Code" className="h-40 w-40 rounded-lg border border-cream mb-2" />
                        )}
                        {storeSettings?.upi_id && (
                          <p className="text-xs font-medium text-espresso mb-3">UPI ID: <span className="text-rose">{storeSettings.upi_id}</span></p>
                        )}
                        <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-dashed border-taupe/40 px-4 py-3 hover:border-rose transition-colors">
                          <Upload size={16} className="text-taupe" />
                          <span className="text-sm text-taupe">{screenshotUrl ? "✅ Screenshot uploaded" : uploading ? "Uploading..." : "Upload payment screenshot"}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => e.target.files[0] && handleScreenshotUpload(e.target.files[0])}
                          />
                        </label>
                      </>
                    )}
                  </div>
                </label>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="flex-1 rounded-full border border-cream py-3 text-sm font-semibold text-espresso hover:border-rose transition-colors">
                  Back
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!canProceedFromPayment}
                  className="flex-1 rounded-full bg-rose py-3 text-sm font-semibold text-white hover:bg-rose-dark disabled:opacity-40 transition-colors"
                >
                  Review Order
                </button>
              </div>
            </div>
          )}

          {/* Step 2 – Review */}
          {step === 2 && (
            <div className="rounded-xl bg-white p-6 shadow-card">
              <h2 className="font-semibold text-espresso mb-4">Review Your Order</h2>

              <div className="space-y-3 mb-5">
                {preview?.items.map((line) => (
                  <div key={`${line.product_id}-${line.variant_id}`} className="flex justify-between items-start text-sm">
                    <div>
                      <p className="font-medium text-espresso">{line.product_name}</p>
                      <p className="text-taupe text-xs">{line.color} · {line.size} · Qty {line.quantity}</p>
                    </div>
                    <span className="font-semibold">{formatINR(line.line_total)}</span>
                  </div>
                ))}
              </div>

              <StitchDivider className="mb-4" />

              <div className="text-sm text-espresso space-y-1.5 mb-6">
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="font-display text-xl">{formatINR(preview?.total)}</span>
                </div>
                <p className="text-xs text-taupe">Payment: {paymentMethod === "cod" ? "Cash on Delivery" : "UPI / Scan & Pay"}</p>
              </div>

              {placeMutation.isError && (
                <div className="mb-3 rounded-lg bg-clay/10 px-3 py-2 text-sm text-clay">
                  Something went wrong. Please try again.
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 rounded-full border border-cream py-3 text-sm font-semibold text-espresso hover:border-rose">
                  Back
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={placeMutation.isPending}
                  className="flex-1 rounded-full bg-rose py-3 text-sm font-semibold text-white hover:bg-rose-dark disabled:opacity-50 transition-colors"
                >
                  {placeMutation.isPending ? "Placing..." : "Place Order"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order mini-summary sidebar */}
        <div className="h-fit rounded-xl bg-white p-5 shadow-card sticky top-24">
          <h3 className="font-semibold text-espresso mb-3 text-sm">Order Total</h3>
          <div className="space-y-1 text-sm text-taupe mb-3">
            <div className="flex justify-between"><span>{preview?.items?.length} item(s)</span></div>
            <div className="flex justify-between"><span>Shipping</span><span className="text-sage font-medium">Free</span></div>
          </div>
          <StitchDivider className="mb-3" />
          <div className="flex justify-between font-semibold text-espresso">
            <span>Total</span>
            <span className="font-display text-xl">{formatINR(preview?.total)}</span>
          </div>
        </div>
      </div>
    </main>
  );
}
