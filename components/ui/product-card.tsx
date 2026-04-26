interface ProductCardProps {
  image: string;
  name: string;
  price: number;
  stock?: number;
  isNew?: boolean;
}

export function ProductCard({ image, name, price, stock, isNew }: ProductCardProps) {
  return (
    <div className="relative flex w-full flex-col gap-4 rounded-lg border p-4 pt-5 md:w-65 md:h-85 md:justify-between md:gap-0 md:pt-6">
      <div>
        {isNew && (
          <span className="absolute rounded-3xl bg-secondary px-3 py-0.5 text-xs text-white">
            Baru
          </span>
        )}
      </div>

      <div className="flex h-[132px] w-full items-center justify-center pb-1 md:h-auto md:pb-4">
        <img
          src={image}
          alt={name}
          className="h-[96px] w-[140px] object-contain md:h-[100px] md:w-[135px]"
        />
      </div>

      <div className="flex flex-col items-start gap-2">
        <h3 className="min-h-10 text-sm leading-5 text-secondary md:min-h-0 md:leading-normal">{name}</h3>
        <div className="flex w-full items-end justify-between gap-3">
          <p className="text-primary-orange font-semibold">Rp. {price.toLocaleString("id-ID")}</p>
          {typeof stock === "number" ? (
            <p className="text-[12px] text-dark-grey/70">Stok : {stock}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
