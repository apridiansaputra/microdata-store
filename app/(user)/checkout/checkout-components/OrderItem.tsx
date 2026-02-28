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
    <div className="flex gap-4">
      <img
        src={image}
        alt={name}
        className="w-16 h-16 object-contain border rounded-md"
      />

      <div className="flex-1">
        <p className="text-sm font-medium leading-snug">
          {name}
        </p>

        <div className="flex justify-between mt-1 text-sm">
          <span className="font-medium">
            Rp {price.toLocaleString("id-ID")}
          </span>
          <span className="text-gray-500">x {quantity}</span>
        </div>
      </div>
    </div>
  );
}
