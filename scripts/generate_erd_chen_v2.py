#!/usr/bin/env python3
"""
Generate Chen Notation ERD for Microdata Store.
Uses matplotlib for precise manual positioning of all elements.

Features:
- Indonesian semantic labels on relationship diamonds
- PK attributes underlined (Chen standard)
- FK attributes with dashed border
- Proper 1/N cardinality markers
- Color-coded: entities (blue), PK (gold), FK (purple), relations (orange)
- Manual grid layout with attribute rings for zero-overlap
"""

from __future__ import annotations

import math
import os
import re
import sys
import tempfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Tuple

import matplotlib
os.environ.setdefault("MPLCONFIGDIR", tempfile.mkdtemp(prefix="mplcfg_"))
matplotlib.use("Agg")

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, Polygon


# ── Data classes ──────────────────────────────────────────────────────────────

@dataclass
class Field:
    name: str
    is_pk: bool = False
    is_fk: bool = False


@dataclass
class Model:
    name: str
    fields: List[Field] = field(default_factory=list)


@dataclass
class Relation:
    source: str
    target: str
    fk_field: str
    label: str
    src_card: str  # "1" or "N"
    tgt_card: str  # "1" or "N"


# ── Schema parser ─────────────────────────────────────────────────────────────

SEMANTIC_LABELS: Dict[Tuple[str, str, str], str] = {
    ("Session", "User", "userId"):                  "milik",
    ("AuthAccount", "User", "userId"):               "milik",
    ("EmailVerification", "User", "userId"):          "milik",
    ("Address", "User", "userId"):                   "milik",
    ("Cart", "User", "userId"):                      "milik",
    ("Order", "User", "userId"):                     "memesan",
    ("Review", "User", "userId"):                    "menulis",
    ("AdminAuditLog", "User", "actorUserId"):        "dicatat oleh",
    ("Negotiation", "User", "userId"):               "mengajukan",
    ("Negotiation", "User", "processedById"):        "diproses oleh",
    ("NegotiationMessage", "User", "senderId"):      "dikirim oleh",
    ("Product", "User", "createdById"):              "dibuat oleh",
    ("Product", "User", "updatedById"):              "diperbarui oleh",
    ("Category", "Category", "parentId"):            "sub-kategori",
    ("Product", "Category", "categoryId"):           "dikategorikan",
    ("ProductImage", "Product", "productId"):        "gambar dari",
    ("CartItem", "Product", "productId"):            "produk",
    ("OrderItem", "Product", "productId"):           "produk pesanan",
    ("NegotiationItem", "Product", "productId"):     "produk negosiasi",
    ("Review", "Product", "productId"):              "ulasan untuk",
    ("CartItem", "Cart", "cartId"):                  "isi keranjang",
    ("OrderItem", "Order", "orderId"):               "item pesanan",
    ("Payment", "Order", "orderId"):                 "pembayaran",
    ("Shipment", "Order", "orderId"):                "pengiriman",
    ("Order", "Address", "shippingAddressId"):       "dikirim ke",
    ("Negotiation", "Order", "finalOrderId"):        "menghasilkan",
    ("PaymentEvent", "Payment", "paymentId"):        "event pembayaran",
    ("NegotiationItem", "Negotiation", "negotiationId"):    "item negosiasi",
    ("NegotiationMessage", "Negotiation", "negotiationId"): "pesan negosiasi",
    ("Review", "OrderItem", "orderItemId"):          "ulasan item",
    ("ReviewImage", "Review", "reviewId"):           "gambar ulasan",
}


def parse_schema(path: Path) -> Tuple[Dict[str, Model], List[Relation]]:
    text = path.read_text(encoding="utf-8")
    model_names: set[str] = set()
    for m in re.finditer(r"^model\s+(\w+)\s*\{", text, re.MULTILINE):
        model_names.add(m.group(1))

    models: Dict[str, Model] = {}
    for m in re.finditer(r"^model\s+(\w+)\s*\{(.*?)^\}", text, re.MULTILINE | re.DOTALL):
        name, body = m.group(1), m.group(2)
        model = Model(name=name)
        for line in body.splitlines():
            line = line.strip()
            if not line or line.startswith("//") or line.startswith("@@"):
                continue
            fm = re.match(r"^(\w+)\s+(\S+)\s*(.*)?$", line)
            if not fm:
                continue
            fname, ftype, fattrs = fm.group(1), fm.group(2), (fm.group(3) or "")
            base = ftype.replace("?", "").replace("[]", "")
            # Skip relation object fields
            if base in model_names and "fields:" not in fattrs:
                continue
            if base in model_names and "fields:" in fattrs:
                continue
            is_pk = "@id" in fattrs
            is_fk = fname.endswith("Id") or fname.endswith("ById")
            model.fields.append(Field(name=fname, is_pk=is_pk, is_fk=is_fk and not is_pk))
        models[name] = model

    # Collect all field-level @unique info from raw text
    field_unique: Dict[Tuple[str, str], bool] = {}
    for m in re.finditer(r"^model\s+(\w+)\s*\{(.*?)^\}", text, re.MULTILINE | re.DOTALL):
        mname = m.group(1)
        body = m.group(2)
        for line in body.splitlines():
            line = line.strip()
            fm = re.match(r"^(\w+)\s+(\S+)\s*(.*)?$", line)
            if not fm:
                continue
            fn = fm.group(1)
            fa = (fm.group(3) or "")
            if "@unique" in fa or "@id" in fa:
                field_unique[(mname, fn)] = True

    # Known 1:1 FK fields (from schema: @unique on FK column)
    UNIQUE_FK_OVERRIDES = {
        ("Cart", "userId"),
        ("Shipment", "orderId"),
        ("Negotiation", "finalOrderId"),
        ("Review", "orderItemId"),
    }

    relations: List[Relation] = []
    for m in re.finditer(r"^model\s+(\w+)\s*\{(.*?)^\}", text, re.MULTILINE | re.DOTALL):
        src = m.group(1)
        body = m.group(2)
        for line in body.splitlines():
            line = line.strip()
            if "@relation(" not in line or "fields:" not in line:
                continue
            fm = re.match(r"^(\w+)\s+(\S+)\s*(.*)?$", line)
            if not fm:
                continue
            tgt = fm.group(2).replace("?", "").replace("[]", "")
            fattrs = fm.group(3) or ""
            flds = re.search(r"fields:\s*\[([^\]]+)\]", fattrs)
            if not flds or tgt not in model_names:
                continue
            for fk in [s.strip() for s in flds.group(1).split(",")]:
                is_unique = (
                    field_unique.get((src, fk), False)
                    or (src, fk) in UNIQUE_FK_OVERRIDES
                )
                key = (src, tgt, fk)
                label = SEMANTIC_LABELS.get(key, "terkait")
                relations.append(Relation(
                    source=src, target=tgt, fk_field=fk,
                    label=label,
                    src_card="1" if is_unique else "N",
                    tgt_card="1",
                ))
    return models, relations


# ── Layout ────────────────────────────────────────────────────────────────────

# Grid layout: (col, row) — wider 5-column grid to spread entities apart
# User at center-top, Product below-center, Order below that
GRID: Dict[str, Tuple[int, int]] = {
    # Row 0: Auth cluster (User at center)
    "Session":            (0, 0),
    "AuthAccount":        (1, 0),
    "User":               (2, 0),
    "EmailVerification":  (3, 0),
    "AdminAuditLog":      (4, 0),

    # Row 1: Address + Category + Product area
    "Address":            (0, 1),
    "Category":           (1, 1),
    "Product":            (3, 1),
    "ProductImage":       (4, 1),

    # Row 2: Cart + Order area (spread wider)
    "Cart":               (0, 2),
    "CartItem":           (1, 2),
    "Order":              (3, 2),
    "OrderItem":          (4, 2),

    # Row 3: Payment + Shipment + Negotiation
    "PaymentEvent":       (0, 3),
    "Payment":            (1, 3),
    "Shipment":           (3, 3),
    "Negotiation":        (4, 3),

    # Row 4: Negotiation children + Review
    "NegotiationMessage": (0, 4),
    "NegotiationItem":    (1, 4),
    "Review":             (3, 4),
    "ReviewImage":        (4, 4),

    # Row 5: Standalone settings
    "AppSetting":         (1, 5),
    "HomeBanner":         (2, 5),
    "AuthBanner":         (3, 5),
}

COL_W = 32.0    # Horizontal spacing (wider)
ROW_H = 24.0    # Vertical spacing (taller)
MARGIN = 14.0   # Canvas margin
ATTR_R = 7.5    # Attribute ring radius

ENT_W = 8.0     # Entity box half-width
ENT_H = 2.0     # Entity box half-height

ATTR_W = 3.5    # Attribute oval half-width
ATTR_H = 0.9    # Attribute oval half-height

DIAM_W = 4.5    # Diamond half-width
DIAM_H = 1.8    # Diamond half-height


# ── Drawing helpers ───────────────────────────────────────────────────────────

def entity_center(name: str) -> Tuple[float, float]:
    col, row = GRID[name]
    return (MARGIN + col * COL_W, MARGIN + row * ROW_H)


def draw_entity(ax, cx, cy, name):
    """Draw entity rectangle."""
    box = FancyBboxPatch(
        (cx - ENT_W / 2, cy - ENT_H / 2), ENT_W, ENT_H,
        boxstyle="round,pad=0.15",
        facecolor="#D4E6F1", edgecolor="#2980B9", linewidth=2.5, zorder=10,
    )
    ax.add_patch(box)
    ax.text(cx, cy, name, ha="center", va="center",
            fontsize=11, fontweight="bold", color="#1A5276", zorder=11)


def draw_attribute(ax, cx, cy, attr: Field, parent_cx, parent_cy):
    """Draw attribute oval and connector line."""
    # Connector line
    ax.plot([parent_cx, cx], [parent_cy, cy],
            color="#BDC3C7", linewidth=0.8, zorder=1)

    if attr.is_pk:
        fc, ec, lw = "#FCF3CF", "#B7950B", 1.2
    elif attr.is_fk:
        fc, ec, lw = "#F5EEF8", "#7D3C98", 1.0
    else:
        fc, ec, lw = "#FDFEFE", "#5D6D7E", 0.8

    ls = "--" if attr.is_fk else "-"

    ellipse = mpatches.Ellipse(
        (cx, cy), ATTR_W, ATTR_H,
        facecolor=fc, edgecolor=ec, linewidth=lw, linestyle=ls, zorder=8,
    )
    ax.add_patch(ellipse)

    # Text — underline for PK
    txt = attr.name
    fontsize = 6.5 if len(txt) > 12 else 7.5
    if attr.is_pk:
        ax.annotate(txt, (cx, cy), ha="center", va="center",
                    fontsize=fontsize, color="#784212", zorder=9,
                    fontweight="bold",
                    bbox=dict(boxstyle="round,pad=0", fc="none", ec="none"))
        # Underline
        tw = len(txt) * 0.22
        ax.plot([cx - tw, cx + tw], [cy - 0.32, cy - 0.32],
                color="#784212", linewidth=1.0, zorder=9)
    else:
        ax.text(cx, cy, txt, ha="center", va="center",
                fontsize=fontsize, color="#34495E", zorder=9)


def draw_diamond(ax, cx, cy, label):
    """Draw relationship diamond."""
    d = Polygon([
        (cx, cy - DIAM_H / 2),
        (cx + DIAM_W / 2, cy),
        (cx, cy + DIAM_H / 2),
        (cx - DIAM_W / 2, cy),
    ], closed=True, facecolor="#FDEBD0", edgecolor="#E67E22",
       linewidth=1.5, zorder=6)
    ax.add_patch(d)

    fontsize = 7 if len(label) > 12 else 8
    ax.text(cx, cy, label, ha="center", va="center",
            fontsize=fontsize, color="#784212", fontweight="bold", zorder=7)


def edge_point(cx, cy, tx, ty, hw, hh):
    """Find intersection point from center (cx,cy) toward (tx,ty) on rectangle border."""
    dx, dy = tx - cx, ty - cy
    if abs(dx) < 1e-9 and abs(dy) < 1e-9:
        return cx, cy
    # Scale to hit box edge
    sx = abs(hw / dx) if abs(dx) > 1e-9 else 1e9
    sy = abs(hh / dy) if abs(dy) > 1e-9 else 1e9
    s = min(sx, sy)
    return cx + dx * s, cy + dy * s


def diamond_point(cx, cy, tx, ty):
    """Find point on diamond edge toward (tx,ty)."""
    dx, dy = tx - cx, ty - cy
    length = math.hypot(dx, dy)
    if length < 1e-9:
        return cx, cy
    ndx, ndy = dx / length, dy / length
    # Diamond has sides at 45 degrees effectively
    # Distance from center to edge along direction (ndx, ndy)
    # For a diamond with half-widths DIAM_W/2 and DIAM_H/2:
    denom = abs(ndx) / (DIAM_W / 2) + abs(ndy) / (DIAM_H / 2)
    if denom < 1e-9:
        return cx, cy
    r = 1.0 / denom
    return cx + ndx * r, cy + ndy * r


# ── Main drawing ──────────────────────────────────────────────────────────────

def draw_erd(models: Dict[str, Model], relations: List[Relation], output: Path):
    max_col = max(c for c, r in GRID.values())
    max_row = max(r for c, r in GRID.values())

    fig_w = (MARGIN * 2 + max_col * COL_W + COL_W) * 0.32
    fig_h = (MARGIN * 2 + max_row * ROW_H + ROW_H) * 0.32

    fig, ax = plt.subplots(figsize=(fig_w, fig_h), dpi=200)
    total_w = MARGIN * 2 + max_col * COL_W + COL_W
    total_h = MARGIN * 2 + max_row * ROW_H + ROW_H
    ax.set_xlim(-2, total_w + 2)
    ax.set_ylim(total_h + 2, -2)
    ax.axis("off")
    ax.set_facecolor("#FAFBFC")
    fig.patch.set_facecolor("#FAFBFC")

    # ── Draw entities & attributes ────────────────────────────────────────
    for name, (col, row) in GRID.items():
        if name not in models:
            continue
        model = models[name]
        cx, cy = entity_center(name)

        # Draw attributes in a ring
        n = len(model.fields)
        for i, f in enumerate(model.fields):
            if n == 1:
                angle = -math.pi / 2
            else:
                angle = 2 * math.pi * i / n - math.pi / 2

            # Adaptive radius
            r = ATTR_R + 0.15 * max(0, n - 10)
            ax_ = cx + r * math.cos(angle)
            ay_ = cy + r * math.sin(angle)
            draw_attribute(ax, ax_, ay_, f, cx, cy)

        draw_entity(ax, cx, cy, name)

    # ── Draw relations ────────────────────────────────────────────────────
    # Track diamonds between same pair to offset them
    pair_count: Dict[Tuple[str, str], int] = {}

    for rel in relations:
        if rel.source not in GRID or rel.target not in GRID:
            continue

        sx, sy = entity_center(rel.source)
        tx, ty = entity_center(rel.target)

        pair = tuple(sorted([rel.source, rel.target]))
        idx = pair_count.get(pair, 0)
        pair_count[pair] = idx + 1

        # Diamond at midpoint with perpendicular offset for duplicates
        mx = (sx + tx) / 2
        my = (sy + ty) / 2

        if idx > 0:
            dx, dy = tx - sx, ty - sy
            length = math.hypot(dx, dy) or 1.0
            perp_x, perp_y = -dy / length, dx / length
            offset = idx * 3.5
            mx += perp_x * offset
            my += perp_y * offset

        # Self-referencing (Category → Category)
        if rel.source == rel.target:
            mx = sx + 10
            my = sy - 7

        draw_diamond(ax, mx, my, rel.label)

        # Lines from entity to diamond
        sp = edge_point(sx, sy, mx, my, ENT_W / 2, ENT_H / 2)
        dp1 = diamond_point(mx, my, sx, sy)
        ax.plot([sp[0], dp1[0]], [sp[1], dp1[1]],
                color="#E67E22", linewidth=1.3, zorder=3)

        tp = edge_point(tx, ty, mx, my, ENT_W / 2, ENT_H / 2)
        dp2 = diamond_point(mx, my, tx, ty)
        ax.plot([dp2[0], tp[0]], [dp2[1], tp[1]],
                color="#E67E22", linewidth=1.3, zorder=3)

        # Cardinality labels
        # Near source
        lx1 = sp[0] + (dp1[0] - sp[0]) * 0.25
        ly1 = sp[1] + (dp1[1] - sp[1]) * 0.25
        ax.text(lx1, ly1 - 0.6, rel.src_card, ha="center", va="center",
                fontsize=10, fontweight="bold", color="#E74C3C", zorder=12,
                bbox=dict(boxstyle="round,pad=0.15", fc="white", ec="none", alpha=0.8))

        # Near target
        lx2 = tp[0] + (dp2[0] - tp[0]) * 0.25
        ly2 = tp[1] + (dp2[1] - tp[1]) * 0.25
        ax.text(lx2, ly2 - 0.6, rel.tgt_card, ha="center", va="center",
                fontsize=10, fontweight="bold", color="#2980B9", zorder=12,
                bbox=dict(boxstyle="round,pad=0.15", fc="white", ec="none", alpha=0.8))

    # ── Title ─────────────────────────────────────────────────────────────
    ax.text(total_w / 2, -0.5, "ERD (Notasi Chen) — Microdata Store",
            ha="center", va="center", fontsize=18, fontweight="bold", color="#2C3E50")
    ax.text(total_w / 2, 1.2, "Dibuat otomatis dari prisma/schema.prisma | 24 Entitas, 31 Relasi",
            ha="center", va="center", fontsize=9, color="#7F8C8D")

    # ── Legend ────────────────────────────────────────────────────────────
    lx = total_w - 14
    ly = total_h - 6

    # Background
    leg_bg = FancyBboxPatch(
        (lx - 5, ly - 1), 18, 5.5,
        boxstyle="round,pad=0.3", facecolor="#F8F9FA", edgecolor="#BDC3C7",
        linewidth=1, zorder=14, alpha=0.95,
    )
    ax.add_patch(leg_bg)
    ax.text(lx + 4, ly - 0.3, "Legenda", ha="center", va="center",
            fontsize=10, fontweight="bold", color="#2C3E50", zorder=15)

    # Entity
    eb = FancyBboxPatch((lx - 4, ly + 0.5), 3.5, 1.0, boxstyle="round,pad=0.1",
                         facecolor="#D4E6F1", edgecolor="#2980B9", linewidth=1.5, zorder=15)
    ax.add_patch(eb)
    ax.text(lx - 2.25, ly + 1.0, "Entitas", ha="center", va="center", fontsize=7, color="#1A5276", zorder=15)

    # PK
    pk = mpatches.Ellipse((lx + 1.5, ly + 1.0), 2.5, 0.8,
                           facecolor="#FCF3CF", edgecolor="#B7950B", linewidth=1, zorder=15)
    ax.add_patch(pk)
    ax.text(lx + 1.5, ly + 1.0, "PK", ha="center", va="center", fontsize=7, fontweight="bold", zorder=15)

    # FK
    fk = mpatches.Ellipse((lx + 5, ly + 1.0), 2.5, 0.8,
                           facecolor="#F5EEF8", edgecolor="#7D3C98", linewidth=1, linestyle="--", zorder=15)
    ax.add_patch(fk)
    ax.text(lx + 5, ly + 1.0, "FK", ha="center", va="center", fontsize=7, zorder=15)

    # Attr
    at = mpatches.Ellipse((lx + 8.5, ly + 1.0), 2.5, 0.8,
                           facecolor="#FDFEFE", edgecolor="#5D6D7E", linewidth=0.8, zorder=15)
    ax.add_patch(at)
    ax.text(lx + 8.5, ly + 1.0, "Atribut", ha="center", va="center", fontsize=7, zorder=15)

    # Diamond
    dd = Polygon([
        (lx - 2.25, ly + 2.2),
        (lx - 0.5, ly + 2.8),
        (lx - 2.25, ly + 3.4),
        (lx - 4.0, ly + 2.8),
    ], closed=True, facecolor="#FDEBD0", edgecolor="#E67E22", linewidth=1.2, zorder=15)
    ax.add_patch(dd)
    ax.text(lx - 2.25, ly + 2.8, "Relasi", ha="center", va="center", fontsize=7, color="#784212", zorder=15)

    ax.text(lx + 2, ly + 2.5, "1 = Satu   |   N = Banyak", ha="left", va="center",
            fontsize=8, color="#34495E", zorder=15)
    ax.text(lx + 2, ly + 3.3, "── garis oranye = relasi", ha="left", va="center",
            fontsize=7, color="#E67E22", zorder=15)
    ax.text(lx + 2, ly + 3.9, "── garis abu = koneksi atribut", ha="left", va="center",
            fontsize=7, color="#BDC3C7", zorder=15)

    # Save
    output.parent.mkdir(parents=True, exist_ok=True)
    fig.tight_layout(pad=0.5)
    fig.savefig(output, bbox_inches="tight", dpi=200, facecolor="#FAFBFC")
    plt.close(fig)
    print(f"Generated: {output} ({output.stat().st_size / 1024:.0f} KB)")


# ── Entry point ───────────────────────────────────────────────────────────────

def main():
    root = Path(__file__).resolve().parents[1]
    schema_path = root / "prisma" / "schema.prisma"
    output_path = root / "docs" / "erd-chen-v2.png"

    if not schema_path.exists():
        print(f"ERROR: {schema_path} not found")
        sys.exit(1)

    models, relations = parse_schema(schema_path)
    print(f"Parsed {len(models)} entities, {len(relations)} relations:")
    for r in relations:
        print(f"  {r.source} --[{r.label}]--> {r.target} ({r.src_card}:{r.tgt_card})")

    draw_erd(models, relations, output_path)


if __name__ == "__main__":
    main()
