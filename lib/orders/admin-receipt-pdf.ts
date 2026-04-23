import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

type ReceiptOrderItem = {
  name: string;
  quantity: number;
  lineSubtotal: number;
};

type ReceiptAddress = {
  recipientName: string;
  phone: string | null;
  street: string;
  detail: string | null;
  subdistrictName: string | null;
  districtName: string;
  cityName: string;
  provinceName: string;
  postalCode: string;
};

export type AdminOrderReceiptInput = {
  orderNumber: string;
  items: ReceiptOrderItem[];
  shippingAddress: ReceiptAddress;
  totals: {
    subtotalAmount: number;
    shippingAmount: number;
    grandTotalAmount: number;
  };
};

const RECEIPT_WIDTH = 315;
const PAGE_MARGIN = 24;
const DASH_GAP = 4;
const DASH_SIZE = 3;

function formatCurrency(value: number) {
  return `Rp. ${new Intl.NumberFormat("id-ID").format(Math.max(0, value))},00`;
}

function sanitizeFileName(input: string) {
  return input.replace(/[^a-zA-Z0-9-_]/g, "_");
}

function textWidth(font: PDFFont, text: string, size: number) {
  return font.widthOfTextAtSize(text, size);
}

function wrapText({
  text,
  font,
  size,
  maxWidth,
}: {
  text: string;
  font: PDFFont;
  size: number;
  maxWidth: number;
}) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (textWidth(font, candidate, size) <= maxWidth) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
      current = word;
      continue;
    }

    let partial = "";
    for (const char of word) {
      const nextPartial = `${partial}${char}`;
      if (textWidth(font, nextPartial, size) <= maxWidth) {
        partial = nextPartial;
      } else {
        if (partial) lines.push(partial);
        partial = char;
      }
    }
    current = partial;
  }

  if (current) lines.push(current);
  return lines;
}

function drawDashedSeparator(page: PDFPage, y: number) {
  page.drawLine({
    start: { x: PAGE_MARGIN, y },
    end: { x: RECEIPT_WIDTH - PAGE_MARGIN, y },
    color: rgb(0.62, 0.64, 0.68),
    thickness: 1,
    dashArray: [DASH_SIZE, DASH_GAP],
  });
}

function drawRightText({
  page,
  font,
  text,
  size,
  xRight,
  y,
  color = rgb(0.08, 0.09, 0.11),
}: {
  page: PDFPage;
  font: PDFFont;
  text: string;
  size: number;
  xRight: number;
  y: number;
  color?: ReturnType<typeof rgb>;
}) {
  page.drawText(text, {
    x: xRight - textWidth(font, text, size),
    y,
    size,
    font,
    color,
  });
}

function buildAddressText(address: ReceiptAddress) {
  return [
    address.street,
    address.detail,
    address.subdistrictName,
    address.districtName,
    address.cityName,
    address.provinceName,
    address.postalCode,
  ]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
}

async function loadLogoBytes() {
  try {
    const response = await fetch("/logo.png", { method: "GET", cache: "no-store" });
    if (!response.ok) return null;
    return await response.arrayBuffer();
  } catch {
    return null;
  }
}

export async function generateAdminOrderReceiptPdf(input: AdminOrderReceiptInput) {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const fullAddress = buildAddressText(input.shippingAddress);
  const addressLines = wrapText({
    text: fullAddress,
    font: fontRegular,
    size: 9,
    maxWidth: RECEIPT_WIDTH - PAGE_MARGIN * 2,
  });

  const tableNameMaxWidth = 146;
  const itemNameLines = input.items.map((item) =>
    wrapText({
      text: item.name,
      font: fontRegular,
      size: 9,
      maxWidth: tableNameMaxWidth,
    }),
  );

  const rowsHeight = itemNameLines.reduce((sum, lines) => {
    const lineCount = Math.max(1, lines.length);
    return sum + 17 + (lineCount - 1) * 10;
  }, 0);

  const pageHeight = Math.max(640, 420 + addressLines.length * 11 + rowsHeight);
  const page = pdfDoc.addPage([RECEIPT_WIDTH, pageHeight]);

  page.drawRectangle({
    x: 0,
    y: 0,
    width: RECEIPT_WIDTH,
    height: pageHeight,
    color: rgb(1, 1, 1),
  });

  page.drawRectangle({
    x: 1,
    y: 1,
    width: RECEIPT_WIDTH - 2,
    height: pageHeight - 2,
    borderColor: rgb(0.9, 0.91, 0.93),
    borderWidth: 1,
  });

  let y = pageHeight - 28;
  const logoBytes = await loadLogoBytes();
  if (logoBytes) {
    const logoImage = await pdfDoc.embedPng(logoBytes);
    const logoDimensions = logoImage.scale(1);
    const maxLogoWidth = 170;
    const logoScale = Math.min(1, maxLogoWidth / logoDimensions.width);
    const logoWidth = logoDimensions.width * logoScale;
    const logoHeight = logoDimensions.height * logoScale;
    page.drawImage(logoImage, {
      x: PAGE_MARGIN,
      y: y - logoHeight,
      width: logoWidth,
      height: logoHeight,
    });
    y -= logoHeight + 14;
  } else {
    page.drawText("MICRODATA", {
      x: PAGE_MARGIN,
      y: y - 16,
      size: 21,
      font: fontBold,
      color: rgb(0.08, 0.09, 0.11),
    });
    y -= 32;
  }

  drawDashedSeparator(page, y);
  y -= 22;

  page.drawText("ID PESANAN:", {
    x: PAGE_MARGIN,
    y,
    size: 9,
    font: fontBold,
    color: rgb(0.25, 0.28, 0.34),
  });
  y -= 16;
  page.drawText(`#${input.orderNumber}`, {
    x: PAGE_MARGIN,
    y,
    size: 12,
    font: fontBold,
    color: rgb(0.08, 0.09, 0.11),
  });
  y -= 14;

  drawDashedSeparator(page, y);
  y -= 20;

  page.drawText("UNTUK", {
    x: PAGE_MARGIN,
    y,
    size: 9,
    font: fontBold,
    color: rgb(0.25, 0.28, 0.34),
  });
  y -= 15;
  page.drawText(input.shippingAddress.recipientName, {
    x: PAGE_MARGIN,
    y,
    size: 11,
    font: fontBold,
    color: rgb(0.08, 0.09, 0.11),
  });
  y -= 15;

  for (const line of addressLines) {
    page.drawText(line, {
      x: PAGE_MARGIN,
      y,
      size: 9,
      font: fontRegular,
      color: rgb(0.14, 0.16, 0.2),
    });
    y -= 11;
  }

  const phoneText = input.shippingAddress.phone?.trim() || "-";
  y -= 3;
  page.drawText(phoneText, {
    x: PAGE_MARGIN,
    y,
    size: 9,
    font: fontRegular,
    color: rgb(0.08, 0.09, 0.11),
  });
  y -= 16;

  drawDashedSeparator(page, y);
  y -= 18;

  page.drawText("DAFTAR PRODUK", {
    x: PAGE_MARGIN,
    y,
    size: 10,
    font: fontBold,
    color: rgb(0.2, 0.21, 0.24),
  });
  y -= 15;

  const noX = PAGE_MARGIN;
  const nameX = PAGE_MARGIN + 24;
  const qtyX = RECEIPT_WIDTH - PAGE_MARGIN - 95;
  const priceRightX = RECEIPT_WIDTH - PAGE_MARGIN;

  page.drawText("No.", {
    x: noX,
    y,
    size: 9,
    font: fontBold,
    color: rgb(0.25, 0.28, 0.34),
  });
  page.drawText("Nama Produk", {
    x: nameX,
    y,
    size: 9,
    font: fontBold,
    color: rgb(0.25, 0.28, 0.34),
  });
  page.drawText("Qty", {
    x: qtyX,
    y,
    size: 9,
    font: fontBold,
    color: rgb(0.25, 0.28, 0.34),
  });
  drawRightText({
    page,
    font: fontBold,
    text: "Harga",
    size: 9,
    xRight: priceRightX,
    y,
    color: rgb(0.25, 0.28, 0.34),
  });
  y -= 9;

  drawDashedSeparator(page, y);
  y -= 14;

  for (let index = 0; index < input.items.length; index += 1) {
    const item = input.items[index];
    const lines = itemNameLines[index] ?? [item.name];
    page.drawText(String(index + 1), {
      x: noX + 2,
      y,
      size: 9,
      font: fontRegular,
      color: rgb(0.12, 0.13, 0.17),
    });

    lines.forEach((line, lineIndex) => {
      page.drawText(line, {
        x: nameX,
        y: y - lineIndex * 10,
        size: 9,
        font: fontRegular,
        color: rgb(0.12, 0.13, 0.17),
      });
    });

    page.drawText(String(item.quantity), {
      x: qtyX + 3,
      y,
      size: 9,
      font: fontRegular,
      color: rgb(0.12, 0.13, 0.17),
    });

    drawRightText({
      page,
      font: fontRegular,
      text: formatCurrency(item.lineSubtotal),
      size: 9,
      xRight: priceRightX,
      y,
      color: rgb(0.12, 0.13, 0.17),
    });

    y -= Math.max(17, lines.length * 10 + 7);
    drawDashedSeparator(page, y);
    y -= 11;
  }

  const totalEntries = [
    { label: "Total Pesanan", value: formatCurrency(input.totals.subtotalAmount), bold: true },
    { label: "Ongkos Kirim", value: formatCurrency(input.totals.shippingAmount), bold: false },
    { label: "Total Pembayaran", value: formatCurrency(input.totals.grandTotalAmount), bold: true },
  ];

  totalEntries.forEach((entry) => {
    page.drawText(entry.label, {
      x: PAGE_MARGIN,
      y,
      size: entry.bold ? 10 : 9,
      font: entry.bold ? fontBold : fontRegular,
      color: rgb(0.12, 0.13, 0.17),
    });
    drawRightText({
      page,
      font: entry.bold ? fontBold : fontRegular,
      text: entry.value,
      size: entry.bold ? 10 : 9,
      xRight: priceRightX,
      y,
      color: rgb(0.12, 0.13, 0.17),
    });
    y -= entry.label === "Total Pembayaran" ? 18 : 15;
  });

  drawDashedSeparator(page, y);
  y -= 28;

  const thankYouText = "Terima Kasih";
  page.drawText(thankYouText, {
    x: (RECEIPT_WIDTH - textWidth(fontBold, thankYouText, 15)) / 2,
    y,
    size: 15,
    font: fontBold,
    color: rgb(0.12, 0.13, 0.17),
  });
  y -= 20;

  const noteText = "Simpan struk ini sebagai bukti pembelian.";
  page.drawText(noteText, {
    x: (RECEIPT_WIDTH - textWidth(fontRegular, noteText, 10)) / 2,
    y,
    size: 10,
    font: fontRegular,
    color: rgb(0.3, 0.32, 0.36),
  });

  return pdfDoc.save();
}

export async function downloadAdminOrderReceiptPdf(input: AdminOrderReceiptInput) {
  const bytes = await generateAdminOrderReceiptPdf(input);
  const arrayBuffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(arrayBuffer).set(bytes);
  const blob = new Blob([arrayBuffer], { type: "application/pdf" });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = `struk-${sanitizeFileName(input.orderNumber)}.pdf`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 0);
}
