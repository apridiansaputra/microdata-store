from __future__ import annotations

import math
import os
import re
import tempfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Tuple

import matplotlib

# Non-GUI backend for headless environment
os.environ.setdefault("MPLCONFIGDIR", tempfile.mkdtemp(prefix="mplcfg_"))
matplotlib.use("Agg")

import matplotlib.pyplot as plt
from matplotlib.patches import Ellipse, Polygon, Rectangle


@dataclass
class ModelField:
    name: str
    type_name: str
    attrs: str


@dataclass
class Model:
    name: str
    fields: List[ModelField] = field(default_factory=list)


@dataclass
class RelationEdge:
    source_model: str
    source_fk: str
    target_model: str
    target_key: str
    on_delete: str | None = None


def normalize_type(type_name: str) -> str:
    return type_name.replace("?", "").replace("[]", "")


def is_relation_object_field(field: ModelField, model_names: set[str]) -> bool:
    return normalize_type(field.type_name) in model_names


def parse_schema(schema_text: str) -> Tuple[Dict[str, Model], List[RelationEdge]]:
    model_names: List[str] = []
    models: Dict[str, Model] = {}

    for model_match in re.finditer(
        r"^model\s+([A-Za-z_][A-Za-z0-9_]*)\s*\{(.*?)^\}",
        schema_text,
        flags=re.MULTILINE | re.DOTALL,
    ):
        model_name = model_match.group(1)
        body = model_match.group(2)
        model_names.append(model_name)
        model = Model(name=model_name)

        for raw_line in body.splitlines():
            line = raw_line.strip()
            if not line or line.startswith("//") or line.startswith("@@"):
                continue

            field_match = re.match(r"^([A-Za-z_][A-Za-z0-9_]*)\s+([^\s]+)\s*(.*)$", line)
            if not field_match:
                continue

            model.fields.append(
                ModelField(
                    name=field_match.group(1),
                    type_name=field_match.group(2),
                    attrs=field_match.group(3).strip(),
                )
            )

        models[model_name] = model

    model_set = set(model_names)
    edges: List[RelationEdge] = []

    for model in models.values():
        for f in model.fields:
            if "@relation(" not in f.attrs:
                continue

            target = normalize_type(f.type_name)
            if target not in model_set:
                continue

            fields_match = re.search(r"fields:\s*\[([^\]]+)\]", f.attrs)
            refs_match = re.search(r"references:\s*\[([^\]]+)\]", f.attrs)
            delete_match = re.search(r"onDelete:\s*([A-Za-z_]+)", f.attrs)
            if not fields_match or not refs_match:
                continue

            fk_fields = [s.strip() for s in fields_match.group(1).split(",") if s.strip()]
            ref_fields = [s.strip() for s in refs_match.group(1).split(",") if s.strip()]
            on_delete = delete_match.group(1) if delete_match else None

            for i, fk in enumerate(fk_fields):
                target_key = ref_fields[i] if i < len(ref_fields) else ref_fields[0]
                edges.append(
                    RelationEdge(
                        source_model=model.name,
                        source_fk=fk,
                        target_model=target,
                        target_key=target_key,
                        on_delete=on_delete,
                    )
                )

    # Keep only physical fields for attribute ovals
    for model in models.values():
        model.fields = [f for f in model.fields if not is_relation_object_field(f, model_set)]

    return models, edges


def assign_columns(model_names: List[str]) -> List[List[str]]:
    # Grouping for clearer layout in this project
    preferred = [
        ["User", "Session", "AuthAccount", "EmailVerification", "Address", "AdminAuditLog"],
        ["Category", "Product", "ProductImage", "Review", "ReviewImage"],
        ["Cart", "CartItem", "Order", "OrderItem", "Shipment", "Payment", "PaymentEvent"],
        ["Negotiation", "NegotiationItem", "NegotiationMessage"],
        ["AppSetting", "HomeBanner"],
    ]

    seen = set()
    for col in preferred:
        seen.update(col)

    leftovers = [name for name in model_names if name not in seen]
    if leftovers:
        preferred.append(leftovers)

    existing = set(model_names)
    return [[name for name in col if name in existing] for col in preferred if any(name in existing for name in col)]


def build_entity_centers(layout_cols: List[List[str]]) -> Tuple[Dict[str, Tuple[float, float]], float, float]:
    margin_x = 8.0
    margin_y = 8.0
    col_gap = 42.0
    row_gap = 24.0

    centers: Dict[str, Tuple[float, float]] = {}

    max_rows = max(len(col) for col in layout_cols) if layout_cols else 0
    max_x = margin_x
    max_y = margin_y

    for c_idx, col in enumerate(layout_cols):
        x = margin_x + c_idx * col_gap
        for r_idx, name in enumerate(col):
            y = margin_y + r_idx * row_gap
            centers[name] = (x, y)
            max_x = max(max_x, x)
            max_y = max(max_y, y)

    total_w = max_x + margin_x + 8.0
    total_h = max(max_y + margin_y + 8.0, (margin_y + (max_rows - 1) * row_gap + margin_y + 8.0))
    return centers, total_w, total_h


def relation_cardinality(source_model: Model, source_fk: str) -> str:
    # If FK field itself unique -> 1, otherwise N (default many-to-one)
    for f in source_model.fields:
        if f.name == source_fk:
            return "1" if "@unique" in f.attrs else "N"
    return "N"


def draw_chen_erd(schema_path: Path, output_path: Path) -> None:
    schema_text = schema_path.read_text(encoding="utf-8")
    models, edges = parse_schema(schema_text)
    model_names = list(models.keys())
    layout_cols = assign_columns(model_names)
    entity_centers, total_w, total_h = build_entity_centers(layout_cols)

    fig_w = max(20, total_w * 0.35)
    fig_h = max(14, total_h * 0.35)
    fig, ax = plt.subplots(figsize=(fig_w, fig_h), dpi=220)
    ax.set_xlim(0, total_w)
    ax.set_ylim(total_h, 0)
    ax.axis("off")

    entity_w = 10.5
    entity_h = 2.8

    # Draw relation diamonds and connectors first
    for idx, edge in enumerate(edges):
        if edge.source_model not in entity_centers or edge.target_model not in entity_centers:
            continue

        sx, sy = entity_centers[edge.source_model]
        tx, ty = entity_centers[edge.target_model]

        mx = (sx + tx) / 2
        my = (sy + ty) / 2
        # Small deterministic offset to reduce overlap
        offset_seed = (idx % 5) - 2
        perp_dx = ty - sy
        perp_dy = -(tx - sx)
        norm = math.hypot(perp_dx, perp_dy) or 1.0
        mx += (perp_dx / norm) * (offset_seed * 1.0)
        my += (perp_dy / norm) * (offset_seed * 1.0)

        diamond_w = 4.4
        diamond_h = 2.1
        diamond = Polygon(
            [
                (mx, my - diamond_h / 2),
                (mx + diamond_w / 2, my),
                (mx, my + diamond_h / 2),
                (mx - diamond_w / 2, my),
            ],
            closed=True,
            facecolor="white",
            edgecolor="black",
            linewidth=0.9,
            zorder=2,
        )
        ax.add_patch(diamond)

        rel_label = f"{edge.source_fk}"
        ax.text(mx, my, rel_label, ha="center", va="center", fontsize=5.5, zorder=3)

        # Entity edge points
        def edge_point(cx: float, cy: float, tx_: float, ty_: float) -> Tuple[float, float]:
            dx = tx_ - cx
            dy = ty_ - cy
            if abs(dx) > abs(dy):
                px = cx + (entity_w / 2) * (1 if dx >= 0 else -1)
                py = cy + (dy / abs(dx + 1e-9)) * (entity_w / 2)
            else:
                py = cy + (entity_h / 2) * (1 if dy >= 0 else -1)
                px = cx + (dx / abs(dy + 1e-9)) * (entity_h / 2)
            return px, py

        s_ex, s_ey = edge_point(sx, sy, mx, my)
        t_ex, t_ey = edge_point(tx, ty, mx, my)

        ax.plot([s_ex, mx], [s_ey, my], color="#666666", linewidth=0.9, zorder=1)
        ax.plot([mx, t_ex], [my, t_ey], color="#666666", linewidth=0.9, zorder=1)

        # Cardinality labels
        source_card = relation_cardinality(models[edge.source_model], edge.source_fk)
        target_card = "1"
        ax.text((s_ex + mx) / 2, (s_ey + my) / 2 - 0.5, source_card, fontsize=6, ha="center", va="center")
        ax.text((t_ex + mx) / 2, (t_ey + my) / 2 - 0.5, target_card, fontsize=6, ha="center", va="center")

    # Draw entities + attributes
    for model_name, (cx, cy) in entity_centers.items():
        model = models[model_name]

        x = cx - entity_w / 2
        y = cy - entity_h / 2
        rect = Rectangle((x, y), entity_w, entity_h, facecolor="white", edgecolor="black", linewidth=1.0, zorder=5)
        ax.add_patch(rect)
        ax.text(cx, cy, model_name, ha="center", va="center", fontsize=8, fontweight="bold", zorder=6)

        fields = model.fields
        n = len(fields)
        if n == 0:
            continue

        # Spread attributes around entity in ellipse ring
        rx = 10.0
        ry = 6.0
        start_deg = -150
        end_deg = 150
        if n == 1:
            angles = [0]
        else:
            angles = [start_deg + i * (end_deg - start_deg) / (n - 1) for i in range(n)]

        for i, f in enumerate(fields):
            ang = math.radians(angles[i])
            ox = cx + rx * math.cos(ang)
            oy = cy + ry * math.sin(ang)

            label = f"{f.name}"
            ell_w = min(8.4, max(4.0, 1.7 + 0.20 * len(label)))
            ell_h = 1.8

            ellipse = Ellipse((ox, oy), width=ell_w, height=ell_h, facecolor="white", edgecolor="black", linewidth=0.8, zorder=4)
            ax.add_patch(ellipse)
            ax.text(ox, oy, label, ha="center", va="center", fontsize=5.6, zorder=5)

            # Connector from entity border toward oval
            ax.plot([cx, ox], [cy, oy], color="#808080", linewidth=0.75, zorder=3)

    ax.text(2.0, 2.0, "ERD (Chen Notation) - Microdata Store", fontsize=12, fontweight="bold", ha="left", va="center")
    ax.text(2.0, 3.4, "Entity: rectangle | Attribute: oval | Relation: diamond | Cardinality: 1 / N", fontsize=7.5, ha="left", va="center")
    ax.text(2.0, 4.7, "Complete entities & attributes from prisma/schema.prisma", fontsize=7.2, ha="left", va="center")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig.tight_layout(pad=0.4)
    fig.savefig(output_path, bbox_inches="tight", dpi=220)
    plt.close(fig)


if __name__ == "__main__":
    root = Path(__file__).resolve().parents[1]
    schema = root / "prisma" / "schema.prisma"
    out_png = root / "docs" / "erd-chen.png"
    draw_chen_erd(schema, out_png)
    print(f"Generated: {out_png}")
