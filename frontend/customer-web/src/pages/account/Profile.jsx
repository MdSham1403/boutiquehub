import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { updateProfile } from "../../api/customer";
import { useAuth } from "../../context/AuthContext";

export default function Profile() {
  const { customer, updateCustomer } = useAuth();
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm();

  useEffect(() => {
    if (customer) reset({ name: customer.name, mobile_number: customer.mobile_number || "" });
  }, [customer]);

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updated) => updateCustomer(updated),
  });

  return (
    <div className="rounded-xl bg-white p-6 shadow-card">
      <h2 className="font-display text-xl text-espresso mb-5">Profile</h2>

      <div className="mb-5 flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-rose/10 flex items-center justify-center text-rose font-display text-xl font-semibold">
          {customer?.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-espresso">{customer?.name}</p>
          <p className="text-sm text-taupe">{customer?.email}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-espresso mb-1">Name</label>
          <input
            {...register("name", { required: "Name is required" })}
            className="w-full rounded-lg border border-cream px-3 py-2 text-sm focus:border-rose focus:outline-none"
          />
          {errors.name && <p className="mt-0.5 text-xs text-clay">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-espresso mb-1">Mobile Number</label>
          <input
            {...register("mobile_number")}
            placeholder="10-digit mobile number"
            className="w-full rounded-lg border border-cream px-3 py-2 text-sm focus:border-rose focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-espresso mb-1">Email</label>
          <input value={customer?.email || ""} disabled className="w-full rounded-lg border border-cream px-3 py-2 text-sm bg-cream text-taupe cursor-not-allowed" />
          <p className="text-xs text-taupe mt-0.5">Email is managed by Google and cannot be changed here.</p>
        </div>

        {mutation.isSuccess && <p className="text-sm text-sage">Profile updated successfully.</p>}
        {mutation.isError && <p className="text-sm text-clay">Failed to update. Try again.</p>}

        <button
          type="submit"
          disabled={!isDirty || mutation.isPending}
          className="rounded-full bg-rose px-6 py-2.5 text-sm font-semibold text-white hover:bg-rose-dark disabled:opacity-40 transition-colors"
        >
          {mutation.isPending ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
