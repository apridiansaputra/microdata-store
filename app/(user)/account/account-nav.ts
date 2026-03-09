import type { LucideIcon } from "lucide-react";
import { Handshake, Package, User } from "lucide-react";

export type AccountNavKey = "profile" | "orders" | "negotiations";

export type AccountNavItem = {
  key: AccountNavKey;
  label: string;
  href: string;
  icon: LucideIcon;
};

export const ACCOUNT_NAV_ITEMS: AccountNavItem[] = [
  {
    key: "profile",
    label: "Profil",
    href: "/account/profile",
    icon: User,
  },
  {
    key: "orders",
    label: "Pesanan Saya",
    href: "/account/order",
    icon: Package,
  },
  {
    key: "negotiations",
    label: "Negosiasi",
    href: "/account/negotiations",
    icon: Handshake,
  },
];
