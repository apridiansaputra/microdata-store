interface ProductCardProps {
  image: string;
  name: string;
  price: number;
  isNew?: boolean;
}

export function ProductCard({ image, name, price, isNew }: ProductCardProps) {
  return (
    <div className="w-65 h-85 border rounded-lg p-4 pt-6 flex flex-col justify-between relative ">
        <div>
            {isNew && (
            <span className="bg-secondary text-white px-3 py-0.5 text-xs rounded-3xl absolute ">
                Baru
            </span>
            )}
        </div>

      <div className="w-full flex justify-center pb-4"><img src={image} alt={name} className="w-[135px] h-[100px] object-contain items-center" /></div>
      
      <div className="flex flex-col items-start gap-2">
        <h3 className="font-extralight text-base">{name}</h3>
        <p className="text-primary-orange font-semibold">Rp. {price.toLocaleString()}</p>
      </div>
    </div>
  );
}
