"use client";

import { ListNode, ListItemNode } from "@lexical/list";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";

import { editorTheme } from "@/components/editor/themes/editor-theme";
import { parseProductDescriptionToEditorState } from "@/lib/products/rich-text";

export function ProductDescriptionViewer({
  value,
}: {
  value: string | null | undefined;
}) {
  const state = parseProductDescriptionToEditorState(value);

  return (
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
      <div className="rounded-lg border border-border-grey/60 bg-white p-4">
        <RichTextPlugin
          contentEditable={
            <ContentEditable className="min-h-[80px] text-sm focus:outline-none" />
          }
          placeholder={null}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <ListPlugin />
      </div>
    </LexicalComposer>
  );
}
