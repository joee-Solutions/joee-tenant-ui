"use client";

import OrganizationSuccessModal from "./OrganizationSuccessModal";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  message: string;
  continueLabel?: string;
  onContinue?: () => void;
};

export default function CrudSuccessModal({
  open,
  onOpenChange,
  title,
  message,
  continueLabel,
  onContinue,
}: Props) {
  return (
    <OrganizationSuccessModal
      open={open}
      onOpenChange={onOpenChange}
      title={title ?? "Success"}
      description={message}
      continueLabel={continueLabel}
      onContinue={onContinue}
    />
  );
}

