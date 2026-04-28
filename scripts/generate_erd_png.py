from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Tuple

import os
import tempfile
import matplotlib

# Keep matplotlib cache inside workspace-safe temp and use non-GUI backend.
os.environ.setdefault("MPLCONFIGDIR", tempfile.mkdtemp(prefix="mplcfg_"))
matplotlib.use("Agg")

import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle


SCALAR_TYPES = {
    "String",
    "Int",
    "BigInt",
    "Boolean",
    "DateTime",
    "Float",
    "Decimal",
    "Json",
    "Bytes",
}


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


def parse_schema(schema_text: str) -> Tuple[Dict[str, Model], List[str], List[RelationEdge]]:
    enum_names: List[str] = []
    model_names: List[str] = []
    models: Dict[str, Model] = {}

    # Enums
    for match in re.finditer(r"^enum\s+([A-Za-z_][A-Za-z0-9_]*)\s*\{", schema_text, flags=re.MULTILINE):
        enum_names.append(match.group(1))

    # Models and fields
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

            # Simple Prisma field line: name type attrs...
            field_match = re.match(r"^([A-Za-z_][A-Za-z0-9_]*)\s+([^\s]+)\s*(.*)$", line)
            if not field_match:
                continue

            field_name = field_match.group(1)
            type_name = field_match.group(2)
            attrs = field_match.group(3).strip()
            model.fields.append(ModelField(name=field_name, type_name=type_name, attrs=attrs))

        models[model_name] = model

    # Relation edges from explicit @relation(fields:[...], references:[...])
    edges: List[RelationEdge] = []
    model_set = set(model_names)
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

            fk_fields = [item.strip() for item in fields_match.group(1).split(",") if item.strip()]
            ref_fields = [item.strip() for item in refs_match.group(1).split(",") if item.strip()]
            on_delete = delete_match.group(1) if delete_match else None

            for i, fk in enumerate(fk_fields):
                ref_key = ref_fields[i] if i < len(ref_fields) else ref_fields[0]
                edges.append(
                    RelationEdge(
                        source_model=model.name,
                        source_fk=fk,
                        target_model=target,
                        target_key=ref_key,
                        on_delete=on_delete,
                    )
                )

    return models, enum_names, edges


def is_db_column(field: ModelField, model_names: set[str]) -> bool:
    base_type = normalize_type(field.type_name)
    # Relation object/list fields are not physical DB columns
    if base_type in model_names:
        return False
    return True


def column_label(field: ModelField) -> str:
    nullable = "?" if "?" in field.type_name else ""
    marks = []
    if "@id" in field.attrs:
        marks.append("PK")
    if "@unique" in field.attrs:
        marks.append("UQ")
    mark_str = f" [{'|'.join(marks)}]" if marks else ""
    return f"{field.name}: {normalize_type(field.type_name)}{nullable}{mark_str}"


def assign_columns(model_names: List[str]) -> List[List[str]]:
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

    # Keep only existing names
    existing = set(model_names)
    return [[name for name in col if name in existing] for col in preferred if any(name in existing for name in col)]


def build_positions(
    models: Dict[str, Model], layout_cols: List[List[str]]
) -> Tuple[Dict[str, Tuple[float, float, float, float]], Dict[Tuple[str, str], float], float, float]:
    node_w = 7.2
    header_h = 0.8
    row_h = 0.42
    col_gap = 1.0
    row_gap = 0.6
    margin = 0.8

    positions: Dict[str, Tuple[float, float, float, float]] = {}
    row_y_map: Dict[Tuple[str, str], float] = {}
    max_height = 0.0

    x = margin
    for col in layout_cols:
        y = margin
        for name in col:
            model = models[name]
            cols = model.fields
            node_h = header_h + len(cols) * row_h + 0.35
            positions[name] = (x, y, node_w, node_h)

            for idx, f in enumerate(cols):
                row_center_y = y + header_h + idx * row_h + row_h * 0.5 + 0.05
                row_y_map[(name, f.name)] = row_center_y

            y += node_h + row_gap
        max_height = max(max_height, y)
        x += node_w + col_gap

    total_w = x - col_gap + margin
    total_h = max_height + margin
    return positions, row_y_map, total_w, total_h


def draw_erd_png(schema_path: Path, output_path: Path) -> None:
    schema_text = schema_path.read_text(encoding="utf-8")
    models, _enums, edges = parse_schema(schema_text)
    model_names = list(models.keys())
    model_name_set = set(model_names)

    # Keep only real DB columns for node rows
    for model in models.values():
        model.fields = [f for f in model.fields if is_db_column(f, model_name_set)]

    layout_cols = assign_columns(model_names)
    positions, row_y_map, total_w, total_h = build_positions(models, layout_cols)

    fig_w = max(16, total_w * 0.72)
    fig_h = max(10, total_h * 0.72)
    fig, ax = plt.subplots(figsize=(fig_w, fig_h), dpi=220)
    ax.set_xlim(0, total_w)
    ax.set_ylim(total_h, 0)
    ax.axis("off")

    # Draw edges first (under nodes)
    for edge in edges:
        if edge.source_model not in positions or edge.target_model not in positions:
            continue
        sx, sy, sw, sh = positions[edge.source_model]
        tx, ty, tw, th = positions[edge.target_model]

        sy_row = row_y_map.get((edge.source_model, edge.source_fk), sy + sh * 0.5)
        ty_row = row_y_map.get((edge.target_model, edge.target_key), ty + th * 0.5)

        source_on_right = sx <= tx
        x1 = sx + sw if source_on_right else sx
        x2 = tx if source_on_right else tx + tw

        # Orthogonal connector
        mid_x = (x1 + x2) / 2
        ax.plot([x1, mid_x], [sy_row, sy_row], color="#737373", linewidth=0.9, alpha=0.7, zorder=1)
        ax.plot([mid_x, mid_x], [sy_row, ty_row], color="#737373", linewidth=0.9, alpha=0.7, zorder=1)
        ax.plot([mid_x, x2], [ty_row, ty_row], color="#737373", linewidth=0.9, alpha=0.7, zorder=1)

    # Draw nodes
    for model_name, (x, y, w, h) in positions.items():
        model = models[model_name]
        header_h = 0.8
        row_h = 0.42

        ax.add_patch(
            Rectangle(
                (x, y),
                w,
                h,
                facecolor="white",
                edgecolor="black",
                linewidth=0.9,
                zorder=3,
            )
        )
        ax.add_patch(
            Rectangle(
                (x, y),
                w,
                header_h,
                facecolor="#f2f2f2",
                edgecolor="black",
                linewidth=0.9,
                zorder=4,
            )
        )
        ax.text(
            x + 0.18,
            y + 0.53,
            model_name,
            fontsize=8.5,
            fontweight="bold",
            va="center",
            ha="left",
            color="black",
            zorder=5,
            family="DejaVu Sans",
        )

        for i, field_obj in enumerate(model.fields):
            yy = y + header_h + i * row_h + row_h * 0.52
            ax.text(
                x + 0.18,
                yy,
                column_label(field_obj),
                fontsize=6.3,
                va="center",
                ha="left",
                color="black",
                zorder=5,
                family="DejaVu Sans Mono",
            )

    ax.text(
        0.8,
        0.35,
        "ERD Microdata Store (Generated from prisma/schema.prisma)",
        fontsize=11,
        fontweight="bold",
        ha="left",
        va="center",
        color="black",
    )
    ax.text(
        0.8,
        0.65,
        "Legend: PK=Primary Key, UQ=Unique, ?=Nullable",
        fontsize=7,
        ha="left",
        va="center",
        color="#333333",
    )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig.tight_layout(pad=0.6)
    fig.savefig(output_path, bbox_inches="tight", dpi=220)
    plt.close(fig)


if __name__ == "__main__":
    root = Path(__file__).resolve().parents[1]
    schema = root / "prisma" / "schema.prisma"
    output = root / "docs" / "erd-database.png"
    draw_erd_png(schema, output)
    print(f"Generated: {output}")
