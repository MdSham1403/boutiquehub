import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Edit2, Star } from "lucide-react";
import { getAddresses, createAddress, updateAddress, deleteAddress } from "../../api/customer";
import AddressForm from "../../components/common/AddressForm";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function Addresses() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState(null); // null | "add" | { id, data }

  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ["addresses"],
    queryFn: getAddresses,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["addresses"] });

  const createMutation = useMutation({ mutationFn: createAddress, onSuccess: () => { invalidate(); setMode(null); } });
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => updateAddress(id, data), onSuccess: () => { invalidate(); setMode(null); } });
  const deleteMutation = useMutation({ mutationFn: deleteAddress, onSuccess: invalidate });
  const setDefaultMutation = useMutation({ mutationFn: (id) => updateAddress(id, { is_default: true }), onSuccess: invalidate });

  if (isLoading) return <LoadingSpinner label="Loading addresses" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-xl text-espresso">Saved Addresses</h2>
        <button onClick={() => setMode("add")} className="flex items-center gap-1.5 rounded-full bg-rose px-4 py-2 text-sm font-semibold text-white hover:bg-rose-dark transition-colors">
          <Plus size={16} /> Add New
        </button>
      </div>

      {mode === "add" && (
        <div className="rounded-xl bg-white p-5 shadow-card mb-4">
          <h3 className="font-semibold text-espresso mb-4">New Address</h3>
          <AddressForm
            onSubmit={(data) => createMutation.mutate(data)}
            loading={createMutation.isPending}
          />
          <button onClick={() => setMode(null)} className="mt-2 text-xs text-taupe hover:text-rose">Cancel</button>
        </div>
      )}

      <div className="space-y-3">
        {addresses.map((addr) => (
          <div key={addr.id} className={`rounded-xl bg-white p-4 shadow-card border-2 ${addr.is_default ? "border-rose" : "border-transparent"}`}>
            {addr.is_default && (
              <div className="flex items-center gap-1 mb-2 text-xs font-semibold text-rose">
                <Star size={12} fill="currentColor" /> Default
              </div>
            )}

            {typeof mode === "object" && mode?.id === addr.id ? (
              <AddressForm
                defaultValues={addr}
                onSubmit={(data) => updateMutation.mutate({ id: addr.id, data })}
                loading={updateMutation.isPending}
                submitLabel="Update Address"
              />
            ) : (
              <>
                <p className="text-sm font-medium text-espresso">{addr.house_no}, {addr.street}</p>
                <p className="text-sm text-taupe">{addr.area}, {addr.city} — {addr.pincode}</p>
                <p className="text-sm text-taupe">{addr.district}, {addr.state}</p>
                {addr.landmark && <p className="text-xs text-taupe">{addr.landmark}</p>}

                <div className="mt-3 flex items-center gap-3 flex-wrap">
                  {!addr.is_default && (
                    <button onClick={() => setDefaultMutation.mutate(addr.id)} className="text-xs text-taupe hover:text-rose font-medium">
                      Set as Default
                    </button>
                  )}
                  <button onClick={() => setMode({ id: addr.id })} className="flex items-center gap-1 text-xs text-taupe hover:text-rose">
                    <Edit2 size={12} /> Edit
                  </button>
                  <button onClick={() => deleteMutation.mutate(addr.id)} className="flex items-center gap-1 text-xs text-taupe hover:text-clay">
                    <Trash2 size={12} /> Remove
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {!addresses.length && !mode && (
          <div className="py-8 text-center text-sm text-taupe">
            No saved addresses. Add one for faster checkout.
          </div>
        )}
      </div>
    </div>
  );
}
