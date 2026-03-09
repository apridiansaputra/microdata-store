"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AccountSectionProps = {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  headerClassName?: string;
  contentClassName?: string;
};

export default function AccountSection({
  title,
  description,
  action,
  children,
  className,
  titleClassName,
  descriptionClassName,
  headerClassName,
  contentClassName,
}: AccountSectionProps) {
  return (
    <section className={cn("rounded-lg bg-light-grey p-6 md:p-8", className)}>
      <div
        className={cn(
          "mb-6",
          description
            ? "flex flex-col gap-4 md:flex-row md:items-start md:justify-between"
            : "flex items-center justify-between",
          headerClassName
        )}
      >
        <div>
          <h3
            className={cn("text-sm font-semibold text-secondary", titleClassName)}
          >
            {title}
          </h3>
          {description ? (
            <p
              className={cn(
                "mt-2 text-xs text-dark-grey",
                descriptionClassName
              )}
            >
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      <div className={cn(contentClassName)}>{children}</div>
    </section>
  );
}
