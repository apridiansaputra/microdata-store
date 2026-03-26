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
  rightContent?: React.ReactNode;
}

export default function Header({
  title,
  breadcrumbItems,
  rightContent,
}: HeaderProps) {
  const hasBreadcrumb = breadcrumbItems && breadcrumbItems.length > 0;
  const hasTitle = !hasBreadcrumb && !!title;
  const effectiveTitle = hasTitle ? title : !hasBreadcrumb ? "Dashboard" : undefined;

  return (
    <div className="sticky top-0 z-30 border-b border-border-grey bg-white px-5">
      <div className="flex min-h-16 items-center justify-between gap-4 py-3">
        <div className="min-w-0">
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

        {rightContent && <div className="shrink-0">{rightContent}</div>}
      </div>
    </div>
  );
}
