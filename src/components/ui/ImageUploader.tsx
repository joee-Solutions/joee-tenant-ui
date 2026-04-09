import { useState, useRef, useEffect } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { useFormContext } from "react-hook-form";
import { toast } from "react-toastify";

interface ProfileImageUploaderProps {
  title?: string;
  name?: string; // Form field name
}

export default function ProfileImageUploader({ 
  title = "Upload Profile Image",
  name = "profileImage"
}: ProfileImageUploaderProps) {
  const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB (raw selected file guard)
  const MAX_BASE64_BYTES = 220 * 1024; // Strict cap for low backend body limits
  const MAX_DIMENSION = 720; // Stronger downscale to keep payload tiny

  const { watch, setValue } = useFormContext();
  const formImageValue = watch(name);
  
  const [image, setImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const getSafeImageSrc = (value: string | null): string | null => {
    if (!value || typeof value !== "string") return null;
    const v = value.trim();
    if (!v) return null;
    if (v.startsWith("data:image/") || v.startsWith("/")) return v;
    try {
      const parsed = new URL(v);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") return v;
    } catch {
      // Ignore malformed URLs from backend/form state
    }
    return null;
  };

  // Initialize and sync local state with form value when form value changes (e.g., from API)
  useEffect(() => {
    // Update image when form value changes (from API load or user selection)
    if (typeof formImageValue === "string" && formImageValue.trim() !== "") {
      const safeFormImage = getSafeImageSrc(formImageValue);
      if (!safeFormImage) {
        setImage(null);
        return;
      }
      setImage(formImageValue);
    } else if (!formImageValue || formImageValue === "" || formImageValue === null) {
      // Only clear if current image is not a newly selected base64 image
      // This prevents clearing when user just selected a new image
      if (!image || !image.startsWith('data:')) {
        setImage(null);
      }
    }
  }, [formImageValue]);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const validateFile = (file) => {
    // Check file type
    if (!file.type.match("image/jpeg") && !file.type.match("image/png")) {
      const message = "Only JPEG and PNG files are accepted";
      setError(message);
      toast.error(message, { toastId: `image-type-${name}` });
      return false;
    }

    // Check file size (max 10MB)
    if (file.size > MAX_UPLOAD_BYTES) {
      const message = "Image is too large. Please upload an image smaller than 10MB.";
      setError(message);
      toast.error(message, { toastId: `image-size-${name}` });
      return false;
    }

    setError("");
    return true;
  };

  const dataUrlSizeBytes = (dataUrl: string): number => {
    const payload = dataUrl.split(",")[1] || "";
    const padding = payload.endsWith("==") ? 2 : payload.endsWith("=") ? 1 : 0;
    return (payload.length * 3) / 4 - padding;
  };

  const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = document.createElement("img");
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = src;
    });

  const toDataUrl = (canvas: HTMLCanvasElement, mime: string, quality?: number): string =>
    canvas.toDataURL(mime, quality);

  const compressForPayload = async (originalDataUrl: string): Promise<string> => {
    const img = await loadImage(originalDataUrl);
    const canvas = document.createElement("canvas");
    const ratio = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
    canvas.width = Math.max(1, Math.round(img.width * ratio));
    canvas.height = Math.max(1, Math.round(img.height * ratio));
    const ctx = canvas.getContext("2d");
    if (!ctx) return originalDataUrl;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Prefer JPEG for much smaller payloads; progressively reduce quality.
    const qualitySteps = [0.7, 0.6, 0.5, 0.4, 0.3, 0.25, 0.2];
    for (const q of qualitySteps) {
      const jpeg = toDataUrl(canvas, "image/jpeg", q);
      if (dataUrlSizeBytes(jpeg) <= MAX_BASE64_BYTES) return jpeg;
    }

    // As a last attempt, downscale more and encode with low jpeg quality.
    const tinyCanvas = document.createElement("canvas");
    tinyCanvas.width = Math.max(1, Math.round(canvas.width * 0.7));
    tinyCanvas.height = Math.max(1, Math.round(canvas.height * 0.7));
    const tinyCtx = tinyCanvas.getContext("2d");
    if (tinyCtx) {
      tinyCtx.drawImage(canvas, 0, 0, tinyCanvas.width, tinyCanvas.height);
      const tiny = toDataUrl(tinyCanvas, "image/jpeg", 0.2);
      if (dataUrlSizeBytes(tiny) <= MAX_BASE64_BYTES) return tiny;
      return tiny;
    }

    return originalDataUrl;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFile(file);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      handleFile(file);
    }
  };

  const handleFile = (file: File) => {
    if (validateFile(file)) {
      setUploading(true);
      setError("");

      // Convert file to base64 data URL
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Image = reader.result as string;
          const optimizedImage = await compressForPayload(base64Image);
          if (dataUrlSizeBytes(optimizedImage) > MAX_BASE64_BYTES) {
            const message =
              "Image is still too large after compression. Please use a smaller image (max 220KB).";
            setError(message);
            toast.error(message, { toastId: `image-still-large-${name}` });
            setUploading(false);
            return;
          }
          setImage(optimizedImage);
          // Update form field with optimized base64 image
          setValue(name, optimizedImage, { shouldValidate: false });
          setUploading(false);
        } catch {
          setError("Failed to process image");
          setUploading(false);
        }
      };
      reader.onerror = () => {
        setError("Failed to read file");
        setUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setError("");
    // Clear form field
    setValue(name, "", { shouldValidate: true });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openFileDialog = () => {
    fileInputRef?.current?.click();
  };

  return (
    <div className="w-full ">
      <label className="block text-lg font-medium text-gray-700 mb-2">
        {title || "Upload Profile Image"}
      </label>
      <div className="flex gap-10 w-full">
        <div
          className={`flex-1 relative border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center h-64 transition-colors w-full
          ${
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 bg-gray-50"
          }
          ${error ? "border-red-500 bg-red-50" : ""}
          ${uploading ? "opacity-70" : ""}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={!image ? openFileDialog : undefined}
          aria-label="Upload profile image"
          role="button"
          tabIndex={0}
        >
          {getSafeImageSrc(image) ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src={getSafeImageSrc(image) as string}
                alt="Profile preview"
                className="max-w-full max-h-full object-contain rounded"
                width={300}
                height={300}
                unoptimized={(getSafeImageSrc(image) as string).startsWith('data:')} // Allow base64 images
              />
              <button
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage();
                }}
                aria-label="Remove image"
              >
                <X size={16} />
              </button>
            </div>
          ) : uploading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-blue-500 border-blue-200 mb-3"></div>
              <p className="text-sm text-gray-600">Uploading...</p>
            </div>
          ) : (
            <>
              <div className="mb-4 text-blue-500">
                {isDragging ? (
                  <ImageIcon size={48} className="animate-pulse" />
                ) : (
                  <Upload size={48} />
                )}
              </div>
              <p className="mb-2 text-lg font-medium text-gray-700">
                {isDragging ? "Drop your image here" : "Drag your image here"}
              </p>
              <p className="mb-4 text-sm text-gray-500">
                (only *.jpeg and *.png will be accepted)
              </p>
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/jpeg,image/png"
            onChange={handleFileChange}
            aria-label="Upload profile image"
          />
        </div>
        {/* <div className="w-[178px] h-[158px] bg-[#D9EDFF] flex items-center justify-center font-medium text-[#999999]">
          {" "}
          <span>300x300</span>
        </div> */}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <p className="mt-2 text-xs text-gray-500">
        Maximum file size: 10MB. For best results, use an image at least 300x300
        pixels.
      </p>
    </div>
  );
}
