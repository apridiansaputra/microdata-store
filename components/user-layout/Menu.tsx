'use client'
import Link from "next/link";
import Container from "./Container";
import { headerData } from "@/constants/data";
import { usePathname } from "next/dist/client/components/navigation";

export default function Menu () {
    const pathName = usePathname();

    return (
        <div className="flex w-full justify-between text-sm">
            {headerData.map((item, index) => (
                <Link key={index} href={item.href} className={`${pathName === item.href ? "font-semibold text-yellow-500" : ""}`}>{item.title}</Link>
            ))}
        </div>
    )
}