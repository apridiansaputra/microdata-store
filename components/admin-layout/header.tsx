import * as React from "react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface BreadcrumbConfigItem {
  label: string;
  href?: string;
}

interface HeaderProps {
  title?: string;
  breadcrumbItems?: BreadcrumbConfigItem[];
}

export default function Header({
  title,
  breadcrumbItems,
}: HeaderProps) {
  const hasBreadcrumb = breadcrumbItems && breadcrumbItems.length > 0;
  const hasTitle = !hasBreadcrumb && !!title;
  const effectiveTitle = hasTitle ? title : !hasBreadcrumb ? "Dashboard" : undefined;

  return (
    <div className="sticky top-0 z-30 flex h-16 flex-col justify-center gap-1 border-b border-border-grey bg-white px-5">
      {hasBreadcrumb && (
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbItems!.map((item, index) => {
              const isLast = index === breadcrumbItems!.length - 1;

              return (
                <React.Fragment key={`${item.label}-${index}`}>
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>{item.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={item.href ?? "#"}>
                        {item.label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast && <BreadcrumbSeparator />}
                </React.Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      )}

      {effectiveTitle && <p className="text-sm">{effectiveTitle}</p>}
    </div>
  );
}
