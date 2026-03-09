"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Menubar, MenubarMenu, MenubarTrigger } from "@/components/ui/menubar";
import { ACCOUNT_NAV_ITEMS, type AccountNavKey } from "./account-nav";

type AccountSidebarProps = {
  activeKey: AccountNavKey;
};

export default function AccountSidebar({ activeKey }: AccountSidebarProps) {
  return (
    <aside className="h-fit lg:self-start">
      <div className="lg:hidden">
        <Menubar className="h-11 w-full justify-between gap-1 overflow-hidden rounded-lg border border-gray-200 bg-light-grey p-1">
          {ACCOUNT_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeKey === item.key;

            return (
              <MenubarMenu key={item.key}>
                <MenubarTrigger
                  asChild
                  className={cn(
                    "h-8 basis-0 grow rounded-md px-2 py-1.5 text-xs whitespace-nowrap",
                    isActive
                      ? "bg-[#FFF0E3] font-medium text-primary-orange hover:text-primary-orange/80"
                      : "text-dark-grey hover:text-dark-grey/70"
                  )}
                >
                  <Link
                    href={item.href}
                    className="flex w-full items-center justify-center gap-1.5"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </MenubarTrigger>
              </MenubarMenu>
            );
          })}

          <MenubarMenu>
            <MenubarTrigger className="h-8 basis-0 grow rounded-md px-2 py-1.5 text-xs whitespace-nowrap text-rose-400 hover:text-rose-400/80 data-[state=open]:text-rose-400">
              <LogOut className="h-4 w-4 text-rose-400" />
              <span className="truncate">Keluar</span>
            </MenubarTrigger>
          </MenubarMenu>
        </Menubar>
      </div>

      <div className="hidden lg:top-35 lg:block">
        <div className="h-fit rounded-lg bg-light-grey p-5 lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto">
          <div className="space-y-5">
            {ACCOUNT_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeKey === item.key;

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md text-sm",
                    isActive
                      ? "font-medium text-primary-orange hover:text-primary-orange/80"
                      : "text-dark-grey hover:text-dark-grey/70"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="mt-8 border-t border-gray-200 pt-5">
            <button
              type="button"
              className="flex items-center gap-2 text-sm text-rose-400"
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
