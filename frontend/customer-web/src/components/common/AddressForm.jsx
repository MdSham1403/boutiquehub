import { useForm } from "react-hook-form";

const FIELD = (label, name, required = true, placeholder = "") => ({ label, name, required, placeholder });
const FIELDS = [
  FIELD("House / Flat No.", "house_no", true, "12B"),
  FIELD("Street", "street", true, "Main Street"),
  FIELD("Area / Locality", "area", true, "T Nagar"),
  FIELD("City", "city", true, "Madurai"),
  FIELD("District", "district", true, "Madurai"),
  FIELD("State", "state", true, "Tamil Nadu"),
  FIELD("Pincode", "pincode", true, "625001"),
  FIELD("Landmark (optional)", "landmark", false, "Near SBI ATM"),
];

export default function AddressForm({ defaultValues, onSubmit, loading, submitLabel = "Save Address" }) {
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {FIELDS.map(({ label, name, required, placeholder }) => (
        <div key={name} className={name === "street" || name === "area" ? "sm:col-span-2" : ""}>
          <label className="block text-sm font-medium text-espresso mb-1">{label}</label>
          <input
            {...register(name, required ? { required: `${label} is required` } : {})}
            placeholder={placeholder}
            className="w-full rounded-lg border border-cream px-3 py-2 text-sm focus:border-rose focus:outline-none"
          />
          {errors[name] && <p className="mt-0.5 text-xs text-clay">{errors[name].message}</p>}
        </div>
      ))}

      <div className="sm:col-span-2 flex items-center gap-2">
        <input type="checkbox" id="is_default" {...register("is_default")} className="accent-rose" />
        <label htmlFor="is_default" className="text-sm text-espresso">Set as default address</label>
      </div>

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-rose py-3 text-sm font-semibold text-white hover:bg-rose-dark disabled:opacity-50 transition-colors"
        >
          {loading ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
