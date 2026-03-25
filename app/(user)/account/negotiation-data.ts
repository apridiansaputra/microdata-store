export type NegotiationStatus = "Ditanggapi" | "Disetujui" | "Ditolak";

export type NegotiationLineItem = {
  id: string;
  productName: string;
  quantity: number;
  basePrice: number;
  initialOffer?: number;
  storeOffer?: number;
};

export type NegotiationRecord = {
  slug: string;
  submissionNo: string;
  date: string;
  status: NegotiationStatus;
  totalAwal: number;
  hasilNego: number;
  lines: NegotiationLineItem[];
};

export const NEGOTIATION_RECORDS: NegotiationRecord[] = [
  {
    slug: "NGO-001",
    submissionNo: "#NGO-001",
    date: "20-11-2025",
    status: "Ditanggapi",
    totalAwal: 60000000,
    hasilNego: 58000000,
    lines: [
      {
        id: "ngo001-item1",
        productName: "Apple MacBook Pro 14\" M3 Pro Chip - 16GB/512GB - Space Gray",
        quantity: 1,
        basePrice: 20000000,
        initialOffer: 19500000,
        storeOffer: 19800000,
      },
      {
        id: "ngo001-item2",
        productName: "Apple MacBook Pro 14\" M3 Pro Chip - 16GB/512GB - Space Gray",
        quantity: 1,
        basePrice: 20000000,
        initialOffer: 19500000,
        storeOffer: 19800000,
      },
      {
        id: "ngo001-item3",
        productName: "Apple MacBook Pro 14\" M3 Pro Chip - 16GB/512GB - Space Gray",
        quantity: 1,
        basePrice: 20000000,
        storeOffer: 20000000,
      },
    ],
  },
  {
    slug: "NGO-002",
    submissionNo: "#NGO-002",
    date: "22-11-2025",
    status: "Disetujui",
    totalAwal: 60000000,
    hasilNego: 58000000,
    lines: [
      {
        id: "ngo002-item1",
        productName: "Apple MacBook Pro 14\" M3 Pro Chip - 16GB/512GB - Space Gray",
        quantity: 1,
        basePrice: 20000000,
        initialOffer: 19700000,
        storeOffer: 19800000,
      },
      {
        id: "ngo002-item2",
        productName: "Apple MacBook Pro 14\" M3 Pro Chip - 16GB/512GB - Space Gray",
        quantity: 1,
        basePrice: 20000000,
        initialOffer: 19500000,
        storeOffer: 19800000,
      },
      {
        id: "ngo002-item3",
        productName: "Apple MacBook Pro 14\" M3 Pro Chip - 16GB/512GB - Space Gray",
        quantity: 1,
        basePrice: 20000000,
        storeOffer: 20000000,
      },
    ],
  },
  {
    slug: "NGO-003",
    submissionNo: "#NGO-003",
    date: "25-11-2025",
    status: "Ditolak",
    totalAwal: 60000000,
    hasilNego: 60000000,
    lines: [
      {
        id: "ngo003-item1",
        productName: "Apple MacBook Pro 14\" M3 Pro Chip - 16GB/512GB - Space Gray",
        quantity: 1,
        basePrice: 20000000,
        initialOffer: 19000000,
      },
      {
        id: "ngo003-item2",
        productName: "Apple MacBook Pro 14\" M3 Pro Chip - 16GB/512GB - Space Gray",
        quantity: 1,
        basePrice: 20000000,
      },
      {
        id: "ngo003-item3",
        productName: "Apple MacBook Pro 14\" M3 Pro Chip - 16GB/512GB - Space Gray",
        quantity: 1,
        basePrice: 20000000,
      },
    ],
  },
];

export function getNegotiationBySlug(slug: string) {
  return NEGOTIATION_RECORDS.find(
    (record) => record.slug.toLowerCase() === slug.toLowerCase()
  );
}

export function formatCurrencyIDR(amount: number) {
  return `Rp. ${new Intl.NumberFormat("id-ID").format(amount)},00`;
}
