import { footerData } from "@/Constants/Data";
import Link from "next/link";
import React from "react";

export default function Footer() {
  return (
    <footer className="w-full border-t mt-auto">
      <div className="bg-gray-100 flex w-full justify-center gap-4 py-4 text-sm">
        {footerData.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.title}
          </Link>
        ))}
      </div>
    </footer>
  );
}