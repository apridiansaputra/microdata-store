export type AdminProduct = {
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
		title: "Laptop Infinix X1 Book RAM 16 GB SSD 512 GB",
		price: 8500000,
		stock: 25,
		sold: 10,
		imageSrc: "/lenovo.png",
	},
	{
		id: 2,
		title: "Laptop Lenovo Ideapad Slim 3 Ryzen 5",
		price: 9200000,
		stock: 18,
		sold: 7,
		imageSrc: "/lenovo.png",
	},
	{
		id: 3,
		title: "Laptop Asus Vivobook 14 OLED i5 Gen 12",
		price: 11500000,
		stock: 12,
		sold: 5,
		imageSrc: "/lenovo.png",
	},
	{
		id: 4,
		title: "Laptop Acer Aspire 5 Slim i5 Gen 11",
		price: 7800000,
		stock: 30,
		sold: 14,
		imageSrc: "/lenovo.png",
	},
	{
		id: 5,
		title: "Laptop HP 14s Ryzen 7 RAM 16 GB",
		price: 10250000,
		stock: 20,
		sold: 9,
		imageSrc: "/lenovo.png",
	},
	{
		id: 6,
		title: "Laptop Dell Inspiron 15 i7 Gen 12",
		price: 13500000,
		stock: 10,
		sold: 4,
		imageSrc: "/lenovo.png",
	},
	{
		id: 7,
		title: "Laptop MSI Modern 14 i5 Gen 12",
		price: 9900000,
		stock: 16,
		sold: 6,
		imageSrc: "/lenovo.png",
	},
	{
		id: 8,
		title: "Laptop Infinix GT Book i5 RAM 16 GB",
		price: 11250000,
		stock: 14,
		sold: 3,
		imageSrc: "/lenovo.png",
	},
];

export const getAdminProductSlug = (product: AdminProduct) =>
	product.title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "");

