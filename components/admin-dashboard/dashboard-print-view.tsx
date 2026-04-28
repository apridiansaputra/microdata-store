"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type PrintViewProps = {
    range: string;
    summaryCards: Array<{
        title: string;
        value: number;
        trend: string;
        trendValue: number;
        isCurrency: boolean;
    }>;
    salesData: Array<{ label: string; pendapatan: number }>;
    topProducts: Array<{
        id: string;
        name: string;
        category: string;
        price: number;
        sold: number;
    }>;
    topLocations: Array<{
        id: string;
        city: string;
        province: string;
        users: number;
    }>;
    orders: Array<{
        id: string;
        customer: string;
        total: number;
        paymentStatus: string;
        shippingStatus: string;
    }>;
};

const RANGE_LABEL: Record<string, string> = {
    today: "Hari Ini",
    "last-7-days": "7 Hari Terakhir",
    "this-month": "Bulan Ini",
    "this-year": "Tahun Ini",
};

const fmtRupiah = (v: number) => `Rp ${Math.max(0, v).toLocaleString("id-ID")}`;

function printedAt() {
    return new Date().toLocaleString("id-ID", {
        day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
}

export function DashboardPrintView(props: PrintViewProps) {
    const [portalEl, setPortalEl] = useState<HTMLDivElement | null>(null);

    useEffect(() => {
        const el = document.createElement("div");
        el.className = "print-portal";
        document.body.appendChild(el);
        setPortalEl(el);

        return () => {
            document.body.removeChild(el);
        };
    }, []);

    if (!portalEl) return null;

    return createPortal(<PrintContent {...props} />, portalEl);
}

function PrintContent({ range, summaryCards, salesData, topProducts, topLocations, orders }: PrintViewProps) {
    return (
        <div style={{ fontFamily: "sans-serif", color: "#0F172A", fontSize: 12 }}>
            {/* Header */}
            <div style={{ borderBottom: "2px solid #FF9644", paddingBottom: 12, marginBottom: 20 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="Microdata Store" style={{ height: 32, width: "auto", display: "block", marginBottom: 4 }} />
                <p style={{ margin: "4px 0 0", fontSize: 13, fontWeight: 600 }}>
                    Laporan Dashboard — {RANGE_LABEL[range] ?? range}
                </p>
                <p style={{ margin: "2px 0 0", color: "#6B7280", fontSize: 11 }}>
                    Dicetak: {printedAt()}
                </p>
            </div>

            <Section title="RINGKASAN PERFORMA">
                <table style={tblStyle}>
                    <thead><tr><Th>Metrik</Th><Th>Nilai</Th><Th>Perubahan</Th></tr></thead>
                    <tbody>
                        {summaryCards.map((c) => (
                            <tr key={c.title}>
                                <Td>{c.title}</Td>
                                <Td bold>{c.isCurrency ? fmtRupiah(c.value) : c.value.toLocaleString("id-ID")}</Td>
                                <Td color={c.trendValue >= 0 ? "#16A34A" : "#DC2626"}>{c.trend}</Td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Section>

            <Section title="DATA PENJUALAN">
                <table style={tblStyle}>
                    <thead><tr><Th>Periode</Th><Th>Pendapatan</Th></tr></thead>
                    <tbody>
                        {salesData.length === 0
                            ? <tr><Td colSpan={2} center>Tidak ada data.</Td></tr>
                            : salesData.map((s, i) => <tr key={i}><Td>{s.label}</Td><Td>{fmtRupiah(s.pendapatan)}</Td></tr>)
                        }
                    </tbody>
                </table>
            </Section>

            <Section title="PRODUK TERLARIS">
                <table style={tblStyle}>
                    <thead><tr><Th>#</Th><Th>Nama Produk</Th><Th>Kategori</Th><Th>Harga</Th><Th>Terjual</Th></tr></thead>
                    <tbody>
                        {topProducts.length === 0
                            ? <tr><Td colSpan={5} center>Tidak ada data.</Td></tr>
                            : topProducts.map((p, i) => (
                                <tr key={p.id}>
                                    <Td>{i + 1}</Td><Td>{p.name}</Td><Td>{p.category}</Td>
                                    <Td>{fmtRupiah(p.price)}</Td><Td>{p.sold}</Td>
                                </tr>
                            ))
                        }
                    </tbody>
                </table>
            </Section>

            <Section title="TOP LOKASI PELANGGAN">
                <table style={tblStyle}>
                    <thead><tr><Th>#</Th><Th>Kota</Th><Th>Provinsi</Th><Th>Pelanggan</Th></tr></thead>
                    <tbody>
                        {topLocations.length === 0
                            ? <tr><Td colSpan={4} center>Tidak ada data.</Td></tr>
                            : topLocations.map((l, i) => (
                                <tr key={l.id}><Td>{i + 1}</Td><Td>{l.city}</Td><Td>{l.province}</Td><Td>{l.users}</Td></tr>
                            ))
                        }
                    </tbody>
                </table>
            </Section>

            <div style={{ marginTop: 32, borderTop: "1px solid #E5E7EB", paddingTop: 8, color: "#6B7280", fontSize: 10 }}>
                Laporan ini digenerate secara otomatis oleh sistem Microdata Store.
            </div>
        </div>
    );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const tblStyle: React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: 11 };

function Section({ title, children, breakBefore }: { title: string; children: React.ReactNode; breakBefore?: boolean }) {
    return (
        <div style={{ marginBottom: 24, ...(breakBefore ? { pageBreakBefore: "always", paddingTop: 16 } : {}) }}>
            <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", color: "#FF9644" }}>
                {title}
            </p>
            {children}
        </div>
    );
}

function Th({ children }: { children: React.ReactNode }) {
    return (
        <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "2px solid #E5E7EB", fontWeight: 700, color: "#0F172A", whiteSpace: "nowrap" }}>
            {children}
        </th>
    );
}

function Td({ children, colSpan, center, bold, color, mono }: {
    children?: React.ReactNode; colSpan?: number; center?: boolean; bold?: boolean; color?: string; mono?: boolean;
}) {
    return (
        <td colSpan={colSpan} style={{
            padding: "5px 8px",
            borderBottom: "1px solid #F3F4F6",
            textAlign: center ? "center" : "left",
            fontWeight: bold ? 600 : 400,
            color: color ?? "#0F172A",
            fontFamily: mono ? "monospace" : undefined,
        }}>
            {children}
        </td>
    );
}
