"use client";

import type { ReactNode } from "react";
import { AlertCircle, Check, Info, Loader2, TriangleAlert, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ConfirmActionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  cancelLabel?: string;
  onCancel?: () => void;
  variant?: "warning" | "error" | "info" | "success";
  visualStyle?: "default" | "dangerCard";
  confirmTone?: "primary" | "danger" | "dangerSoft";
  confirmIcon?: ReactNode;
  loading?: boolean;
};

const iconMap = {
  warning: AlertCircle,
  error: TriangleAlert,
  info: Info,
  success: Check,
} as const;

const iconToneMap = {
  warning: {
    outer: "bg-amber-50",
    inner: "bg-amber-100",
    icon: "text-amber-600",
  },
  error: {
    outer: "bg-rose-50",
    inner: "bg-rose-100",
    icon: "text-rose-600",
  },
  info: {
    outer: "bg-sky-50",
    inner: "bg-sky-100",
    icon: "text-sky-600",
  },
  success: {
    outer: "bg-emerald-50",
    inner: "bg-emerald-100",
    icon: "text-emerald-600",
  },
} as const;

export function ConfirmActionDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  cancelLabel = "Batal",
  onCancel,
  variant = "warning",
  visualStyle = "default",
  confirmTone = "primary",
  confirmIcon,
  loading = false,
}: ConfirmActionDialogProps) {
  const Icon = iconMap[variant];
  const tone = iconToneMap[variant];
  const isDangerCard = visualStyle === "dangerCard";
  const hasCancel = Boolean(cancelLabel) && !isDangerCard;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "rounded-2xl border border-gray-200 bg-white shadow-md",
          isDangerCard ? "max-w-[430px] p-7" : "max-w-[430px] p-6 sm:p-7",
        )}
      >
        <DialogClose className="absolute right-4 top-4 inline-flex h-7 w-7 items-center justify-center rounded-md text-secondary/80 transition-colors hover:bg-light-grey hover:text-secondary">
          <X className="h-5 w-5" />
          <span className="sr-only">Tutup</span>
        </DialogClose>

        {!isDangerCard ? (
          <div className="mx-auto mb-4 mt-1 flex h-14 w-14 items-center justify-center">
            <div className={cn("flex h-14 w-14 items-center justify-center rounded-full", tone.outer)}>
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", tone.inner)}>
                <Icon className={cn("h-5 w-5", tone.icon)} />
              </div>
            </div>
          </div>
        ) : null}

        <DialogTitle
          className={cn(
            "leading-tight font-semibold text-secondary",
            isDangerCard ? "text-left text-4xl" : "text-center text-[28px]",
          )}
        >
          {title}
        </DialogTitle>
        <DialogDescription
          className={cn(
            "mt-2 text-base leading-7 text-dark-grey/80",
            isDangerCard ? "max-w-none text-left" : "mx-auto max-w-[320px] text-center",
          )}
        >
          {description}
        </DialogDescription>

        <div className={cn("mt-6 grid gap-3", hasCancel ? "grid-cols-2" : "grid-cols-1")}>
          {hasCancel ? (
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => {
                onCancel?.();
                onOpenChange(false);
              }}
              className="h-11 rounded-xl border-gray-200 text-sm font-medium text-secondary hover:bg-light-grey"
            >
              {cancelLabel}
            </Button>
          ) : null}
          <Button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={cn(
              "h-11 rounded-xl text-sm font-semibold",
              confirmTone === "danger"
                ? "bg-red-500 text-white hover:bg-red-500/90"
                : confirmTone === "dangerSoft"
                  ? "justify-between border border-rose-100 bg-rose-50 px-5 text-rose-600 hover:bg-rose-100"
                  : "bg-primary-orange text-white hover:bg-primary-orange/90",
            )}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>{confirmLabel}</span>
                {confirmIcon ? <span className="ml-3">{confirmIcon}</span> : null}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
