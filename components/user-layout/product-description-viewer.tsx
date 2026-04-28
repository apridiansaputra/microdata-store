"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
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

export function ProductDescriptionViewer({
  value,
  maxLines = 4,
}: {
  value: string | null | undefined;
  maxLines?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [isExpandable, setIsExpandable] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const state = useMemo(() => parseProductDescriptionToEditorState(value), [value]);

  useEffect(() => {
    if (!contentRef.current || expanded) return;

    const contentNode = contentRef.current;
    const checkOverflow = () => {
      setIsExpandable(contentNode.scrollHeight - contentNode.clientHeight > 1);
    };

    const frameId = window.requestAnimationFrame(checkOverflow);
    const timeoutId = window.setTimeout(checkOverflow, 50);
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(checkOverflow);
      resizeObserver.observe(contentNode);
    }

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
      resizeObserver?.disconnect();
    };
  }, [expanded, maxLines, state]);

  return (
    <div className="space-y-2 bg-light-grey p-4 rounded-sm">
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
                ref={contentRef}
                className={cn("text-sm leading-relaxed text-secondary focus:outline-none", !expanded && "overflow-hidden")}
                style={
                  !expanded
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
