"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckCircle2 } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description: string;
  continueLabel?: string;
  onContinue?: () => void;
};

export default function OrganizationSuccessModal({
  open,
  onOpenChange,
  title = "Success",
  description,
  continueLabel = "Continue",
  onContinue,
}: Props) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white flex flex-col items-center text-center sm:max-w-md">
        <AlertDialogHeader className="flex flex-col items-center">
          <CheckCircle2 className="size-[100px] fill-[#3FA907] text-white" />
          <AlertDialogTitle className="font-medium text-[#3FA907] text-4xl">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="font-normal text-base text-[#737373]">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center w-full">
          <AlertDialogAction
            className="h-[60px] w-full max-w-[291px] bg-[#3FA907] text-white font-medium text-base"
            onClick={() => {
              onOpenChange(false);
              onContinue?.();
            }}
          >
            {continueLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
