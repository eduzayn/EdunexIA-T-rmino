import React, { useState, useRef, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FormControl } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Image as ImageIcon } from "lucide-react";

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

const ImageUpload = forwardRef<HTMLInputElement, ImageUploadProps>(
  (
    {
      onImageUpload,
      onImageRemove,
      previewUrl,
      className,
      accept = "image/*",
      maxSize = 5, // 5MB default
      helperText,
      ...props
    },
    ref
  ) => {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleClick = () => {
      fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validação de tipo de arquivo
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Tipo de arquivo inválido",
          description: "Por favor, selecione apenas arquivos de imagem (JPG, PNG, etc.).",
          variant: "destructive",
        });
        return;
      }

      // Validação de tamanho do arquivo
      if (file.size > maxSize * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: `O tamanho máximo permitido é ${maxSize}MB.`,
          variant: "destructive",
        });
        return;
      }

      onImageUpload?.(file);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (!file) return;

      // Validação de tipo de arquivo
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Tipo de arquivo inválido",
          description: "Por favor, selecione apenas arquivos de imagem (JPG, PNG, etc.).",
          variant: "destructive",
        });
        return;
      }

      // Validação de tamanho do arquivo
      if (file.size > maxSize * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: `O tamanho máximo permitido é ${maxSize}MB.`,
          variant: "destructive",
        });
        return;
      }

      onImageUpload?.(file);
    };

    return (
      <FormControl>
        <div
          className={cn(
            "relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50",
            className
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {previewUrl ? (
            <div className="relative w-full h-full">
              <img
                src={previewUrl}
                alt="Preview"
                className="object-contain w-full h-full p-2"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={onImageRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-2 p-4 text-center">
              <div className="rounded-full bg-muted p-3">
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Arraste uma imagem ou clique para selecionar</p>
                {helperText && (
                  <p className="text-xs text-muted-foreground">{helperText}</p>
                )}
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="mt-2"
                onClick={handleClick}
              >
                <Upload className="h-4 w-4 mr-2" />
                Selecionar imagem
              </Button>
            </div>
          )}

          <input
            ref={ref || fileInputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={handleFileChange}
            {...props}
          />
        </div>
      </FormControl>
    );
  }
);

ImageUpload.displayName = "ImageUpload";

export { ImageUpload };