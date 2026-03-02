type OrderItemProps = {
  name: string;
  price: number;
  quantity: number;
  image: string;
};

export default function OrderItem({
  name,
  price,
  quantity,
  image,
}: OrderItemProps) {
  return (
    <div className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-x-6 text-sm">
      <div className="rounded-xs border border-dark-grey/10 bg-white-200 p-2">
        <img src={image} alt={name} width={60} height={60} />
      </div>

      <p className="font-medium leading-snug">
        {name}
      </p>

      <div className="flex min-w-[150px] justify-between gap-4">
        <span className="font-medium">Rp {price.toLocaleString("id-ID")}</span>
        <span className="text-primary-orange">x {quantity}</span>
      </div>
    </div>
  );
}
