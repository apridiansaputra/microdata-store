"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type ExpandableDescriptionProps = {
  text: string;
  className?: string;
};

export default function ExpandableDescription({ text, className }: ExpandableDescriptionProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={cn("mt-2 space-y-4", className)}>
      <p
        className={cn(
          "text-sm transition-all duration-300",
          expanded ? "max-h-[600px]" : "max-h-[72px] overflow-hidden"
        )}
      >
        {text}
      </p>
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-secondary"
        aria-expanded={expanded}
      >
        <span>{expanded ? "lihat lebih sedikit" : "lihat selengkapnya"}</span>
        <ChevronDown
          className={cn("size-4 transition-transform duration-300", expanded && "rotate-180")}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}
