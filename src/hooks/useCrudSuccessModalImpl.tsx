"use client";

import { useCallback, useRef, useState } from "react";
import CrudSuccessModal from "@/components/shared/modals/CrudSuccessModal";

type TriggerOptions = {
  title?: string;
  message: string;
  continueLabel?: string;
  onContinue?: () => void;
};

export function useCrudSuccessModalImpl() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState<string>("Success");
  const [message, setMessage] = useState<string>("");
  const [continueLabel, setContinueLabel] = useState<string>("Continue");

  const onContinueRef = useRef<(() => void) | undefined>(undefined);

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      onContinueRef.current = undefined;
    }
  }, []);

  const triggerSuccess = useCallback((options: TriggerOptions) => {
    setTitle(options.title ?? "Success");
    setMessage(options.message);
    setContinueLabel(options.continueLabel ?? "Continue");
    onContinueRef.current = options.onContinue;
    setOpen(true);
  }, []);

  const SuccessModal = (
    <CrudSuccessModal
      open={open}
      onOpenChange={handleOpenChange}
      title={title}
      message={message}
      continueLabel={continueLabel}
      onContinue={() => onContinueRef.current?.()}
    />
  );

  return { triggerSuccess, SuccessModal };
}

