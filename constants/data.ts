export const headerData = [
  { title: "Beranda", href: "/" },
	{ title: "Semua Produk", href: "/products" },
  { title: "Laptop", href: "/laptop" },
  { title: "Kategori Tiga", href: "/kategori-tiga" },
  { title: "Kategori Empat", href: "/kategori-empat" },
  { title: "Kategori Lima", href: "/kategori-lima" },
]

export const footerHelp = [
  { title: "Tentang Kami", href: "/tentang-kami" },
  { title: "Kontak", href: "/kontak" },
  { title: "Kebijakan Privasi", href: "/kebijakan-privasi" },
  { title: "Syarat dan Ketentuan", href: "/syarat-dan-ketentuan" },
]

export const footerCategory = [
  { title: "Laptop", href: "/kategori/infinix-200" },
  { title: "Smartphone", href: "/kategori/smartphone" },
  { title: "Komputer", href: "/kategori/komputer" },
  { title: "Hardware", href: "/kategori/hardware" },
]

export type AdminProduct = {
    isNew: boolean | undefined;
	id: number;
	title: string;
	price: number;
	stock: number;
	sold: number;
	imageSrc: string;
}; 

export const ADMIN_PRODUCTS: AdminProduct[] = [
	{
		id: 1,
		title: "Laptop Infinix X1 book RAM 600 GB 7000 SSD",
		price: 8500000,
		stock: 25,
		sold: 10,
		imageSrc: "/lenovo.png",
		isNew: true
	},
	{
		id: 2,
		title: "Apple MacBook Pro 14 Inch M3 Pro Chip RAM 16GB/512GB, Color Space Gray",
		price: 9200000,
		stock: 18,
		sold: 7,
		imageSrc: "/samsung.png",
		isNew: undefined
	},
	{
		id: 3,
		title: "Laptop Asus Vivobook 14 OLED i5 Gen 12",
		price: 11500000,
		stock: 12,
		sold: 5,
		imageSrc: "/lenovo.png",
		isNew: true
	},
	{
		id: 4,
		title: "Laptop Acer Aspire 5 Slim i5 Gen 11",
		price: 7800000,
		stock: 30,
		sold: 14,
		imageSrc: "/lenovo.png",
		isNew: undefined
	},
	{
		id: 5,
		title: "Laptop HP 14s Ryzen 7 RAM 16 GB",
		price: 10250000,
		stock: 20,
		sold: 9,
		imageSrc: "/lenovo.png",
		isNew: true
	},
	{
		id: 6,
		title: "Laptop Dell Inspiron 15 i7 Gen 12",
		price: 13500000,
		stock: 10,
		sold: 4,
		imageSrc: "/lenovo.png",
		isNew: undefined
	},
	{
		id: 7,
		title: "Laptop MSI Modern 14 i5 Gen 12",
		price: 9900000,
		stock: 16,
		sold: 6,
		imageSrc: "/lenovo.png",
		isNew: undefined
	},
	{
		id: 8,
		title: "Laptop Infinix GT Book i5 RAM 16 GB",
		price: 11250000,
		stock: 14,
		sold: 3,
		imageSrc: "/lenovo.png",
		isNew: undefined
	},
];

export const getAdminProductSlug = (product: AdminProduct) =>
	product.title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "");


