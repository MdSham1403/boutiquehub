import { useState } from "react";
import { Upload, X, Film } from "lucide-react";
import { uploadProductImages, deleteProductImage, uploadProductVideo } from "../../api/products";

export default function ProductImageManager({ product, onUpdate }) {
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const handleImageUpload = async (files) => {
    if (!files.length) return;
    setUploading(true);
    try {
      await uploadProductImages(product.id, Array.from(files));
      onUpdate();
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    await deleteProductImage(product.id, imageId);
    onUpdate();
  };

  const handleVideoUpload = async (file) => {
    if (!file) return;
    setUploadingVideo(true);
    try {
      await uploadProductVideo(product.id, file);
      onUpdate();
    } finally {
      setUploadingVideo(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-ink mb-2">Product Images</p>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {product.images?.map((img) => (
            <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden border border-border">
              <img src={img.image_url} alt="" className="h-full w-full object-cover" />
              <button
                onClick={() => handleDeleteImage(img.id)}
                className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>

        <label className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 cursor-pointer hover:border-brand transition-colors">
          <Upload size={16} className="text-muted" />
          <span className="text-sm text-muted">{uploading ? "Uploading..." : "Upload images"}</span>
          <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleImageUpload(e.target.files)} />
        </label>
      </div>

      <div>
        <p className="text-sm font-medium text-ink mb-2">Product Video (optional)</p>
        {product.video_url && (
          <video src={product.video_url} controls className="w-full rounded-lg mb-2 max-h-48" />
        )}
        <label className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 cursor-pointer hover:border-brand transition-colors">
          <Film size={16} className="text-muted" />
          <span className="text-sm text-muted">{uploadingVideo ? "Uploading..." : product.video_url ? "Replace video" : "Upload video"}</span>
          <input type="file" accept="video/*" className="hidden" onChange={(e) => handleVideoUpload(e.target.files[0])} />
        </label>
      </div>
    </div>
  );
}
