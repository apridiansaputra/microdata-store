"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

import { AuthFeedbackDialog } from "@/components/ui/auth-feedback-dialog";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart-components/cart-context";
import { cn } from "@/lib/utils";

type Props = {
  productId: string;
  className?: string;
};

export function AddToCartButton({ productId, className }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    open: boolean;
    variant: "success" | "error";
    title: string;
    description: string;
  } | null>(null);
  const { addItem, openCart } = useCart();

  const handleClick = async () => {
    setIsSubmitting(true);
    const result = await addItem({
      productId,
      quantity: 1,
    });
    setIsSubmitting(false);

    if (!result.ok) {
      setFeedback({
        open: true,
        variant: "error",
        title: "Gagal Menambahkan Produk",
        description: result.error ?? "Produk belum berhasil masuk ke keranjang.",
      });
      return;
    }

    openCart();
  };

  return (
    <>
      <Button
        disabled={isSubmitting}
        className={cn(
          "mt-12 cursor-pointer bg-primary-orange py-6 text-sm hover:bg-primary-orange/90",
          className,
        )}
        onClick={() => {
          void handleClick();
        }}
      >
        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Masukkan Keranjang"}
      </Button>

      <AuthFeedbackDialog
        open={feedback?.open ?? false}
        onOpenChange={(open) => {
          if (!open) setFeedback(null);
        }}
        variant={feedback?.variant ?? "success"}
        title={feedback?.title ?? ""}
        description={feedback?.description ?? ""}
      />
    </>
  );
}
