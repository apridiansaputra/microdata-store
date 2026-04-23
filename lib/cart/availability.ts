export const OUT_OF_STOCK_CHECKOUT_MESSAGE =
  "Stok produk sudah habis karena dibeli pengguna lain.";

type CartCheckoutSnapshotItem = {
  id: string;
  quantity: number;
  isSelected: boolean;
  product: {
    name: string;
    stock: number;
  };
};

type CheckoutValidationResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      status: number;
      error: string;
    };

export function validateCheckoutCartItems(args: {
  requestedItemIds: string[];
  cartItems: CartCheckoutSnapshotItem[];
}): CheckoutValidationResult {
  const requestedCount = new Set(args.requestedItemIds).size;
  if (args.cartItems.length !== requestedCount) {
    return {
      ok: false,
      status: 404,
      error: "Item checkout tidak ditemukan.",
    };
  }

  const outOfStockItem = args.cartItems.find((item) => item.product.stock <= 0);
  if (outOfStockItem) {
    return {
      ok: false,
      status: 409,
      error: OUT_OF_STOCK_CHECKOUT_MESSAGE,
    };
  }

  const insufficientItem = args.cartItems.find((item) => item.quantity > item.product.stock);
  if (insufficientItem) {
    return {
      ok: false,
      status: 409,
      error: `Stok produk "${insufficientItem.product.name}" tidak mencukupi.`,
    };
  }

  const unselectedItem = args.cartItems.find((item) => !item.isSelected);
  if (unselectedItem) {
    return {
      ok: false,
      status: 409,
      error: "Pilih produk yang tersedia di keranjang sebelum checkout.",
    };
  }

  return { ok: true };
}
