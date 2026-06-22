import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

const COLORS_HINT = "e.g. Pink, Black, Navy Blue";
const SIZES_HINT = "e.g. S, M, L, XL";

export default function ProductForm({ defaultValues, categories, onSubmit, loading, submitLabel = "Save Product" }) {
  const { register, control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: defaultValues || {
      name: "", category_id: "", sku: "", price: "", offer_price: "",
      fabric: "", description: "", wash_instructions: "", tags: "",
      variants: [{ color: "", size: "", stock: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "variants" });

  return (
    <form
      onSubmit={handleSubmit((data) => {
        const payload = {
          ...data,
          category_id: Number(data.category_id),
          price: Number(data.price),
          offer_price: data.offer_price ? Number(data.offer_price) : null,
          variants: data.variants.map((v) => ({ ...v, stock: Number(v.stock) })),
        };
        onSubmit(payload);
      })}
      className="space-y-6"
    >
      {/* Basic info */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-ink mb-1">Product Name</label>
          <input {...register("name", { required: "Name is required" })} className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
          {errors.name && <p className="mt-0.5 text-xs text-clay">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">Category</label>
          <select {...register("category_id", { required: "Category is required" })} className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none">
            <option value="">Select category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {errors.category_id && <p className="mt-0.5 text-xs text-clay">{errors.category_id.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">SKU</label>
          <input {...register("sku", { required: "SKU is required" })} placeholder="KUR-001" className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
          {errors.sku && <p className="mt-0.5 text-xs text-clay">{errors.sku.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">Price (₹)</label>
          <input {...register("price", { required: "Price is required", min: { value: 1, message: "Must be positive" } })} type="number" step="0.01" className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
          {errors.price && <p className="mt-0.5 text-xs text-clay">{errors.price.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">Offer Price (₹, optional)</label>
          <input {...register("offer_price")} type="number" step="0.01" className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">Fabric</label>
          <input {...register("fabric")} placeholder="Cotton, Silk, etc." className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">Tags (comma separated)</label>
          <input {...register("tags")} placeholder="festive, casual, trending" className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-ink mb-1">Description</label>
          <textarea {...register("description")} rows={3} className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-ink mb-1">Wash Instructions</label>
          <input {...register("wash_instructions")} placeholder="Hand wash separately in cold water" className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
        </div>
      </div>

      {/* Variants */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-ink">Variants (Color, Size, Stock)</label>
          <button type="button" onClick={() => append({ color: "", size: "", stock: 0 })} className="flex items-center gap-1 text-xs font-medium text-brand hover:underline">
            <Plus size={14} /> Add Variant
          </button>
        </div>
        <p className="text-xs text-muted mb-2">{COLORS_HINT} · {SIZES_HINT}</p>

        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2 items-center">
              <input {...register(`variants.${index}.color`, { required: true })} placeholder="Color" className="flex-1 rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
              <input {...register(`variants.${index}.size`, { required: true })} placeholder="Size" className="w-24 rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
              <input {...register(`variants.${index}.stock`, { required: true, min: 0 })} type="number" placeholder="Stock" className="w-24 rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
              <button type="button" onClick={() => remove(index)} disabled={fields.length === 1} className="text-muted hover:text-clay disabled:opacity-30 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-brand py-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50 transition-colors"
      >
        {loading ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
