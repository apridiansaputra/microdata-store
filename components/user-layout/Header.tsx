"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, Menu, SearchIcon, ShoppingCartIcon } from "lucide-react";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../ui/sheet";
import { InputGroup, InputGroupAddon, InputGroupInput } from "../ui/input-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { AuthFeedbackDialog } from "@/components/ui/auth-feedback-dialog";
import Container from "./Container";
import CartSheet from "@/components/cart-components/CartSheet";
import { useCart } from "@/components/cart-components/cart-context";
import { useUserAuth } from "@/components/auth/user-auth-context";

export default function Header() {
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [desktopSearch, setDesktopSearch] = React.useState("");
  const [mobileSearch, setMobileSearch] = React.useState("");
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{
    open: boolean;
    variant: "success" | "error";
    title: string;
    description: string;
  } | null>(null);

  const { user: authUser, isLoading: isAuthLoading, logout } = useUserAuth();
  const { isCartOpen, openCart, closeCart } = useCart();
  const router = useRouter();

  const goToSearchResult = React.useCallback(
    (keyword: string) => {
      const query = keyword.trim();
      const targetUrl = query ? `/products?q=${encodeURIComponent(query)}` : "/products";
      setDesktopSearch(query);
      setMobileSearch(query);
      setIsSearchOpen(false);
      router.push(targetUrl);
    },
    [router],
  );

  const handleDesktopSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    goToSearchResult(desktopSearch);
  };

  const handleMobileSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    goToSearchResult(mobileSearch);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      const result = await logout();

      if (!result.ok) {
        setFeedback({
          open: true,
          variant: "error",
          title: "Logout Gagal",
          description: result.error ?? "Sesi gagal diakhiri. Silakan coba lagi.",
        });
        return;
      }

      closeCart();
      router.refresh();

      setFeedback({
        open: true,
        variant: "success",
        title: "Logout Berhasil",
        description: "Anda telah keluar dari akun.",
      });
    } catch {
      setFeedback({
        open: true,
        variant: "error",
        title: "Logout Gagal",
        description: "Terjadi gangguan jaringan. Silakan coba lagi.",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Container>
      <div className="flex w-full items-center justify-between">
        <Image src="/logo.png" alt="Logo" width={120} height={40} />

        <div className="relative hidden w-1/3 md:block">
          <form onSubmit={handleDesktopSearchSubmit}>
            <InputGroup className="rounded-full bg-white">
              <InputGroupAddon align="inline-start">
                <SearchIcon className="h-5 w-5 text-muted-foreground" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Cari produk impianmu"
                value={desktopSearch}
                onChange={(event) => setDesktopSearch(event.target.value)}
              />
            </InputGroup>
          </form>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
          <div className="flex items-center md:hidden">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center justify-center"
            >
              <SearchIcon className="h-6 w-6 cursor-pointer" />
            </button>

            {isSearchOpen ? (
              <div className="fixed inset-0 z-50 flex flex-col gap-4 bg-white p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Cari Produk</h2>
                  <button
                    type="button"
                    onClick={() => setIsSearchOpen(false)}
                    className="cursor-pointer p-2"
                  >
                    X
                  </button>
                </div>
                <form onSubmit={handleMobileSearchSubmit}>
                  <InputGroup className="w-full rounded-full">
                    <InputGroupAddon align="inline-start">
                      <SearchIcon className="h-5 w-5 text-muted-foreground" />
                    </InputGroupAddon>
                    <InputGroupInput
                      placeholder="Cari Produk"
                      autoFocus
                      value={mobileSearch}
                      onChange={(event) => setMobileSearch(event.target.value)}
                    />
                  </InputGroup>
                </form>
              </div>
            ) : null}
          </div>

          {isAuthLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-dark-grey/60" />
          ) : authUser ? (
            <>
              <Sheet open={isCartOpen} onOpenChange={(open) => (open ? openCart() : closeCart())}>
                <SheetTrigger asChild>
                  <ShoppingCartIcon className="h-6 w-6 cursor-pointer" />
                </SheetTrigger>

                <SheetContent className="p-6">
                  <SheetHeader>
                    <SheetTitle className="mb-8 text-lg font-semibold">Keranjang Belanja</SheetTitle>
                  </SheetHeader>
                  <CartSheet />
                </SheetContent>
              </Sheet>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Menu className="h-6 w-6 cursor-pointer" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-xs text-dark-grey">Menu</DropdownMenuLabel>
                    <DropdownMenuSeparator className="mb-3" />
                    <DropdownMenuItem asChild className="cursor-pointer text-xs">
                      <Link href="/account/profile">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer text-xs">
                      <Link href="/account/order">Pesanan Saya</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer text-xs">
                      <Link href="/account/negotiations">Negosiasi</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      disabled={isLoggingOut}
                      onClick={() => {
                        void handleLogout();
                      }}
                      className="cursor-pointer text-xs text-rose-600 focus:text-rose-600"
                    >
                      {isLoggingOut ? (
                        <Loader2 className="mr-2 size-3.5 animate-spin" />
                      ) : (
                        <LogOut className="mr-2 size-3.5" />
                      )}
                      Keluar
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                asChild
                size="sm"
                variant="outline"
                className="h-9 border-primary-orange/30 text-primary-orange hover:bg-primary-orange/5"
              >
                <Link href="/register">Daftar</Link>
              </Button>
              <Button asChild size="sm" className="h-9 bg-primary-orange text-white hover:bg-primary-orange/90">
                <Link href="/login">Masuk</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
      <AuthFeedbackDialog
        open={feedback?.open ?? false}
        onOpenChange={(open) => {
          if (!open) setFeedback(null);
        }}
        variant={feedback?.variant ?? "success"}
        title={feedback?.title ?? ""}
        description={feedback?.description ?? ""}
      />
    </Container>
  );
}
