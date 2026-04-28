"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type AuthBanner = {
    id: string;
    imageUrl: string;
    altText: string | null;
    title: string | null;
    subtitle: string | null;
};

export function AuthBannerPanel() {
    const [banner, setBanner] = useState<AuthBanner | null>(null);

    useEffect(() => {
        fetch("/api/settings/auth-banner", { cache: "no-store" })
            .then((res) => res.json())
            .then((data: { banners?: AuthBanner[] }) => {
                const first = data.banners?.[0] ?? null;
                setBanner(first);
            })
            .catch(() => null);
    }, []);

    if (!banner) {
        return (
            <aside className="hidden h-full items-center justify-center rounded-xl bg-dark-grey lg:flex" />
        );
    }

    return (
        <aside className="relative hidden h-full overflow-hidden rounded-xl lg:flex">
            <Image
                src={banner.imageUrl}
                alt={banner.altText ?? banner.title ?? "Auth Banner"}
                fill
                className="object-cover"
                sizes="50vw"
                priority
            />
            {(banner.title || banner.subtitle) && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            )}
            {(banner.title || banner.subtitle) && (
                <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                    {banner.title && (
                        <p className="text-2xl font-bold leading-tight drop-shadow">{banner.title}</p>
                    )}
                    {banner.subtitle && (
                        <p className="mt-2 text-sm font-light leading-relaxed text-white/85 drop-shadow">
                            {banner.subtitle}
                        </p>
                    )}
                </div>
            )}
        </aside>
    );
}
