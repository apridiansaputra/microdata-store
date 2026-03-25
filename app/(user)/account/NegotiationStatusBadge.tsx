import { cn } from "@/lib/utils";
import type { NegotiationStatus } from "./negotiation-data";

const STATUS_TONE: Record<NegotiationStatus, string> = {
  Ditanggapi: "bg-[#EFF8FF] text-[#175CD3]",
  Disetujui: "bg-[#ECFDF3] text-[#027A48]",
  Ditolak: "bg-[#FEF3F2] text-[#B42318]",
};

const STATUS_DOT_TONE: Record<NegotiationStatus, string> = {
  Ditanggapi: "bg-[#2E90FA]",
  Disetujui: "bg-[#12B76A]",
  Ditolak: "bg-[#F04438]",
};

type NegotiationStatusBadgeProps = {
  status: NegotiationStatus;
  className?: string;
};

export default function NegotiationStatusBadge({
  status,
  className,
}: NegotiationStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
        STATUS_TONE[status],
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT_TONE[status])} />
      {status}
    </span>
  );
}
