import Image from "next/image";
import * as React from "react";
import { cn } from "@/lib/utils";

type ProductCardProps = Omit<React.ComponentPropsWithoutRef<"article">, "title"> & {
  title: string;
  price: number;
  stock: number;
  sold: number;
  imageSrc: string;
  imageAlt?: string;
  stockLabel?: string;
  soldLabel?: string;
};

const formatRupiah = (value: number) => `Rp. ${new Intl.NumberFormat("id-ID").format(value)}`;

export default function ProductCard({
  title,
  price,
  stock,
  sold,
  imageSrc,
  imageAlt = "Product image",
  stockLabel = "Stok",
  soldLabel = "Terjual",
  className,
  ...props
}: ProductCardProps) {
  return (
    <article className={cn("rounded-lg bg-white p-4 max-w-56 cursor-pointer hover:shadow-lg transition-all","flex flex-col gap-8 justify-between",className)}{...props}>
        <div className="relative h-[120px] w-full overflow-hidden rounded-xl bg-white">
          <Image src={imageSrc} alt={imageAlt} fill sizes="100px" className="object-contain" />
        </div>
      
        <div className="flex flex-col gap-5">
            <div className="space-y-2 flex flex-col gap-2">
                <h3 className=" overflow-hidden text-sm leading-tight font-medium text-dark-grey">
                    {title}
                </h3>
                <p className="text-sm leading-none font-semibold text-primary-orange">
                    {formatRupiah(price)}
                </p>
            </div>

            <div className="flex items-center justify-between text-xs text-dark-grey/70">
                <p>{stockLabel}: {stock}</p>
                <p>{soldLabel}: {sold}</p>
            </div>
        </div>
    </article>
  );
}
