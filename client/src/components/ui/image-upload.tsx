import React, { useState, useRef, useEffect } from "react";
import { Upload, X, Check, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploadProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onImageUpload?: (file: File) => void;
  onImageRemove?: () => void;
  previewUrl?: string;
  className?: string;
  isDragging?: boolean;
  accept?: string;
  maxSize?: number; // in MB
  helperText?: string;
}

export function ImageUpload({
  onImageUpload,
  onImageRemove,
  previewUrl,
  className,
  accept = "image/jpeg,image/png,image/webp",
  maxSize = 5, // default 5MB
  helperText = "Arraste uma imagem ou clique para fazer upload",
  ...props
}: ImageUploadProps) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | undefined>(previewUrl);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalPreviewUrl(previewUrl);
  }, [previewUrl]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const validateFile = (file: File): boolean => {
    // Validate file type
    if (!file.type.match(/^image\/(jpeg|png|webp|jpg)$/)) {
      setError("Tipo de arquivo inválido. Apenas JPG, PNG e WebP são permitidos.");
      return false;
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`O arquivo é muito grande. O tamanho máximo é ${maxSize}MB.`);
      return false;
    }

    setError(null);
    return true;
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileSelected(file);
    }
  };

  const handleFileSelected = (file: File) => {
    if (validateFile(file)) {
      // Generate local preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setLocalPreviewUrl(result);
      };
      reader.readAsDataURL(file);

      // Call parent handler
      if (onImageUpload) {
        onImageUpload(file);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFileSelected(file);
    }
  };

  const handleRemoveImage = () => {
    setLocalPreviewUrl(undefined);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    if (onImageRemove) {
      onImageRemove();
    }
  };

  const handleButtonClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 transition-colors",
          {
            "border-primary bg-primary/5": isDraggingOver,
            "border-gray-300 hover:border-primary": !isDraggingOver && !localPreviewUrl,
            "border-none p-0": localPreviewUrl,
          }
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {localPreviewUrl ? (
          <div className="relative w-full">
            <img
              src={localPreviewUrl}
              alt="Preview"
              className="w-full h-auto rounded-lg object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={handleRemoveImage}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center cursor-pointer py-4"
            onClick={handleButtonClick}
          >
            <div className="bg-primary/10 rounded-full p-4 mb-4">
              <ImageIcon className="h-8 w-8 text-primary" />
            </div>
            <p className="text-sm text-gray-600 text-center mb-2">{helperText}</p>
            <p className="text-xs text-gray-500 text-center">
              JPG, PNG ou WebP (max. {maxSize}MB)
            </p>
            {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
          </div>
        )}
        <input
          type="file"
          className="hidden"
          accept={accept}
          onChange={handleInputChange}
          ref={inputRef}
          {...props}
        />
      </div>
    </div>
  );
}

export default ImageUpload;