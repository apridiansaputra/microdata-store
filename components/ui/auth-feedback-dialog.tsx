"use client";

import { AlertCircle, Check, Info, TriangleAlert, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type AuthFeedbackDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant: "success" | "error" | "warning" | "info";
  title: string;
  description: string;
  actionLabel?: string;
};

export function AuthFeedbackDialog({
  open,
  onOpenChange,
  variant,
  title,
  description,
  actionLabel,
}: AuthFeedbackDialogProps) {
  const iconMap = {
    success: Check,
    error: AlertCircle,
    warning: TriangleAlert,
    info: Info,
  };
  const iconToneMap = {
    success: {
      outer: "bg-emerald-50",
      inner: "bg-emerald-100",
      icon: "text-emerald-600",
    },
    error: {
      outer: "bg-rose-50",
      inner: "bg-rose-100",
      icon: "text-rose-600",
    },
    warning: {
      outer: "bg-amber-50",
      inner: "bg-amber-100",
      icon: "text-amber-600",
    },
    info: {
      outer: "bg-sky-50",
      inner: "bg-sky-100",
      icon: "text-sky-600",
    },
  };

  const Icon = iconMap[variant];
  const tone = iconToneMap[variant];
  const fallbackActionLabel = variant === "success" ? "Lanjutkan" : "Coba Lagi";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[430px] rounded-2xl border border-gray-200 bg-white p-6 shadow-md sm:p-7"
      >
        <DialogClose className="absolute right-4 top-4 inline-flex h-7 w-7 items-center justify-center rounded-md text-secondary/80 transition-colors hover:bg-light-grey hover:text-secondary">
          <X className="h-5 w-5" />
          <span className="sr-only">Tutup</span>
        </DialogClose>

        <div className="mx-auto mb-4 mt-1 flex h-14 w-14 items-center justify-center rounded-full bg-transparent">
          <div className={cn("flex h-14 w-14 items-center justify-center rounded-full", tone.outer)}>
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", tone.inner)}>
              <Icon className={cn("h-5 w-5", tone.icon)} />
            </div>
          </div>
        </div>

        <DialogTitle className="text-center text-[28px] leading-tight font-semibold text-secondary">
          {title}
        </DialogTitle>
        <DialogDescription className="mx-auto mt-2 max-w-[320px] text-center text-base leading-7 text-dark-grey/80">
          {description}
        </DialogDescription>

        <Button
          type="button"
          onClick={() => onOpenChange(false)}
          className="mt-6 h-11 w-full rounded-xl bg-primary-orange text-sm font-semibold text-white hover:bg-primary-orange/90"
        >
          {actionLabel ?? fallbackActionLabel}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
