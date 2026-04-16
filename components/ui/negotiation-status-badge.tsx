import { cn } from "@/lib/utils";

export type NegotiationBadgeStatus =
  | "OPEN"
  | "COUNTERED"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED"
  | "CANCELLED";

const STATUS_TONE: Record<NegotiationBadgeStatus, string> = {
  OPEN: "bg-[#E8E5F6] text-[#7B75C5]",
  COUNTERED: "bg-[#E8E5F6] text-[#7B75C5]",
  ACCEPTED: "bg-[#E7F4EC] text-[#4FA57D]",
  REJECTED: "bg-[#F7E1D6] text-[#D37E55]",
  EXPIRED: "bg-[#F7E1D6] text-[#D37E55]",
  CANCELLED: "bg-[#F7E1D6] text-[#D37E55]",
};

type NegotiationStatusBadgeProps = {
  status: NegotiationBadgeStatus;
  label?: string;
  className?: string;
};

export default function NegotiationStatusBadge({
  status,
  label,
  className,
}: NegotiationStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-[10px] leading-none font-semibold",
        STATUS_TONE[status],
        className,
      )}
    >
      {label ?? status}
    </span>
  );
}
