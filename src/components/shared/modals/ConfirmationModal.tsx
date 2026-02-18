"use client";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ConfirmationModalProps {
  title: string;
  message: string;
  itemName?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export default function ConfirmationModal({
  title,
  message,
  itemName,
  onConfirm,
  onCancel,
  isProcessing = false,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "default",
}: ConfirmationModalProps) {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }} 
      onClick={onCancel}
    >
      <div 
        className="bg-white rounded-lg p-6 w-full max-w-md mx-auto" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-black">{title}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-gray-700 mb-6">
          {message}
          {itemName && (
            <span className="font-semibold"> {itemName}</span>
          )}?
        </p>
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onCancel}
            className="px-6"
            disabled={isProcessing}
          >
            {cancelText}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            disabled={isProcessing}
            className={`px-6 ${
              confirmVariant === "destructive"
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-[#003465] hover:bg-[#0d2337] text-white"
            }`}
          >
            {isProcessing ? "Processing..." : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

