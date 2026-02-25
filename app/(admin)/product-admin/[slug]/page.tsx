import Image from "next/image";
import { ADMIN_PRODUCTS, getAdminProductSlug } from "@/constants/data";

type ProductDetailPageProps = {
	params: {
		slug: string;
	};
};

const formatRupiah = (value: number) => `Rp. ${new Intl.NumberFormat("id-ID").format(value)}`;

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
	const product = ADMIN_PRODUCTS.find(
		(item) => getAdminProductSlug(item) === params.slug
	);

	if (!product) {
		return (
			<div className="p-6">
				<h1 className="text-xl font-semibold mb-2">Produk tidak ditemukan</h1>
			</div>
		);
	}

	return (
		<div className="p-6 flex flex-col gap-6 md:flex-row">
			<div className="relative h-64 w-full max-w-sm overflow-hidden rounded-xl bg-white shadow">
				<Image
					src={product.imageSrc}
					alt={product.title}
					fill
					sizes="320px"
					className="object-contain"
				/>
			</div>

			<div className="flex-1 space-y-4">
				<h1 className="text-lg font-semibold text-dark-grey">{product.title}</h1>
				<p className="text-xl font-bold text-primary-orange">
					{formatRupiah(product.price)}
				</p>

				<div className="flex gap-6 text-sm text-dark-grey/80">
					<p>Stok: <span className="font-medium">{product.stock}</span></p>
					<p>Terjual: <span className="font-medium">{product.sold}</span></p>
				</div>

				<div className="mt-4 text-sm text-gray-600">
					<p>
						Detail produk ini masih berupa data dummy. Kamu bisa menghubungkan ke data
						dari database atau API nanti, menggunakan slug
						sebagai identitas unik produk.
					</p>
				</div>
			</div>
		</div>
	);
}

