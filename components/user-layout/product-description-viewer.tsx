"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { ListNode, ListItemNode } from "@lexical/list";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ChevronDown } from "lucide-react";

import { editorTheme } from "@/components/editor/themes/editor-theme";
import { parseProductDescriptionToEditorState } from "@/lib/products/rich-text";
import { cn } from "@/lib/utils";

function getNodeTextLength(node: unknown): number {
  if (!node || typeof node !== "object") return 0;

  const current = node as { text?: unknown; children?: unknown };
  let total = 0;

  if (typeof current.text === "string") {
    total += current.text.trim().length;
  }

  if (Array.isArray(current.children)) {
    total += current.children.reduce((sum, child) => sum + getNodeTextLength(child), 0);
  }

  return total;
}

export function ProductDescriptionViewer({
  value,
  maxLines = 5,
}: {
  value: string | null | undefined;
  maxLines?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const state = parseProductDescriptionToEditorState(value);
  const descriptionTextLength = useMemo(() => getNodeTextLength(state), [state]);
  const isExpandable = descriptionTextLength > 240;

  return (
    <div className="space-y-2">
      <LexicalComposer
        initialConfig={{
          namespace: "ProductDescriptionViewer",
          editable: false,
          theme: editorTheme,
          nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode],
          editorState: JSON.stringify(state),
          onError: (error) => {
            console.error(error);
          },
        }}
      >
        <div className="bg-transparent p-0">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className={cn("text-sm leading-relaxed text-secondary focus:outline-none", !expanded && "overflow-hidden")}
                style={
                  !expanded && isExpandable
                    ? ({
                        display: "-webkit-box",
                        WebkitBoxOrient: "vertical",
                        WebkitLineClamp: maxLines,
                      } as CSSProperties)
                    : undefined
                }
              />
            }
            placeholder={null}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <ListPlugin />
        </div>
      </LexicalComposer>

      {isExpandable ? (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-dark-grey/90 transition-colors hover:text-secondary"
        >
          {expanded ? "Sembunyikan" : "Lihat selengkapnya"}
          <ChevronDown className={cn("h-4 w-4 transition-transform", expanded ? "rotate-180" : "")} />
        </button>
      ) : null}
    </div>
  );
}
