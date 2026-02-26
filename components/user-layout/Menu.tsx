'use client'
import Link from "next/link";
import Container from "./Container";
import { headerData } from "@/constants/data";
import { usePathname } from "next/dist/client/components/navigation";

export default function Menu () {
    const pathName = usePathname();

    return (
        <Container>
            <div className="flex justify-around w-full text-sm mt-6 ">
                {headerData.map((item, index) => (
                    <Link key={index} href={item.href} className={`text-xs ${pathName === item.href ? "font-semibold text-primary-orange" : ""}`}>{item.title}</Link>
                ))}
            </div>
        </Container>
    )
}