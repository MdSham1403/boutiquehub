import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export default function ImageGallery({ images = [], productName = "" }) {
  const [selected, setSelected] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (!images.length) {
    return (
      <div className="aspect-[3/4] rounded-xl bg-cream flex items-center justify-center text-taupe/30 text-7xl">
        👗
      </div>
    );
  }

  const prev = () => setSelected((s) => (s === 0 ? images.length - 1 : s - 1));
  const next = () => setSelected((s) => (s === images.length - 1 ? 0 : s + 1));

  return (
    <>
      <div>
        <div
          className="relative aspect-[3/4] overflow-hidden rounded-xl bg-cream cursor-zoom-in"
          onClick={() => setLightbox(true)}
        >
          <img
            src={images[selected].image_url}
            alt={`${productName} image ${selected + 1}`}
            className="h-full w-full object-cover transition-opacity duration-300"
          />
          {images.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 hover:bg-white shadow">
                <ChevronLeft size={18} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 hover:bg-white shadow">
                <ChevronRight size={18} />
              </button>
            </>
          )}
        </div>

        {images.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
            {images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setSelected(i)}
                className={`shrink-0 h-16 w-16 rounded-lg overflow-hidden border-2 transition-colors ${i === selected ? "border-rose" : "border-transparent"}`}
              >
                <img src={img.image_url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/90"
          onClick={() => setLightbox(false)}
        >
          <button className="absolute top-4 right-4 text-white" onClick={() => setLightbox(false)}>
            <X size={28} />
          </button>
          <img
            src={images[selected].image_url}
            alt={productName}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          {images.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white hover:bg-white/40">
                <ChevronLeft size={24} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white hover:bg-white/40">
                <ChevronRight size={24} />
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
