"use client";

import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  type SerializedEditorState,
  type TextFormatType,
} from "lexical";
import { useEffect, useState } from "react";
import { ListNode, ListItemNode, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from "@lexical/list";
import { $setBlocksType } from "@lexical/selection";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HeadingNode, QuoteNode, $createHeadingNode } from "@lexical/rich-text";
import { Bold, Heading1, Heading2, Heading3, Italic, List as ListIcon, ListOrdered, Pilcrow, Underline } from "lucide-react";

import { Button } from "@/components/ui/button";
import { editorTheme } from "@/components/editor/themes/editor-theme";
import {
  parseProductDescriptionToEditorState,
  stringifyEditorState,
} from "@/lib/products/rich-text";

function EditorToolbar() {
  const [editor] = useLexicalComposerContext();
  const [activeFormats, setActiveFormats] = useState<string[]>([]);

  useEffect(() => {
    const unregisterUpdate = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          setActiveFormats([]);
          return;
        }

        const nextFormats: string[] = [];
        (["bold", "italic", "underline"] as const).forEach((format) => {
          if (selection.hasFormat(format)) {
            nextFormats.push(format);
          }
        });
        setActiveFormats(nextFormats);
      });
    });

    const unregisterSelection = editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => false,
      COMMAND_PRIORITY_LOW,
    );

    return () => {
      unregisterUpdate();
      unregisterSelection();
    };
  }, [editor]);

  const applyBlockType = (type: "paragraph" | "h1" | "h2" | "h3") => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      if (type === "paragraph") {
        $setBlocksType(selection, () => $createParagraphNode());
        return;
      }

      $setBlocksType(selection, () => $createHeadingNode(type));
    });
  };

  const applyFormat = (format: TextFormatType) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  const applyList = (type: "ol" | "ul") => {
    editor.dispatchCommand(
      type === "ol" ? INSERT_ORDERED_LIST_COMMAND : INSERT_UNORDERED_LIST_COMMAND,
      undefined,
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border-grey p-3">
      <Button type="button" variant="outline" size="sm" onClick={() => applyBlockType("paragraph")}>
        <Pilcrow className="size-4" />
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={() => applyBlockType("h1")}>
        <Heading1 className="size-4" />
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={() => applyBlockType("h2")}>
        <Heading2 className="size-4" />
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={() => applyBlockType("h3")}>
        <Heading3 className="size-4" />
      </Button>

      <span className="mx-1 h-6 w-px bg-border-grey" />

      <Button
        type="button"
        variant={activeFormats.includes("bold") ? "default" : "outline"}
        size="sm"
        onClick={() => applyFormat("bold")}
      >
        <Bold className="size-4" />
      </Button>
      <Button
        type="button"
        variant={activeFormats.includes("italic") ? "default" : "outline"}
        size="sm"
        onClick={() => applyFormat("italic")}
      >
        <Italic className="size-4" />
      </Button>
      <Button
        type="button"
        variant={activeFormats.includes("underline") ? "default" : "outline"}
        size="sm"
        onClick={() => applyFormat("underline")}
      >
        <Underline className="size-4" />
      </Button>

      <span className="mx-1 h-6 w-px bg-border-grey" />

      <Button type="button" variant="outline" size="sm" onClick={() => applyList("ul")}>
        <ListIcon className="size-4" />
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={() => applyList("ol")}>
        <ListOrdered className="size-4" />
      </Button>
    </div>
  );
}

export function ProductDescriptionEditor({
  initialValue,
  onChange,
}: {
  initialValue?: string | null;
  onChange: (nextValue: string) => void;
}) {
  const [initialSerializedState] = useState<SerializedEditorState>(() =>
    parseProductDescriptionToEditorState(initialValue),
  );

  return (
    <LexicalComposer
      initialConfig={{
        namespace: "ProductDescriptionEditor",
        theme: editorTheme,
        nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode],
        editorState: JSON.stringify(initialSerializedState),
        onError: (error) => {
          console.error(error);
        },
      }}
    >
      <div className="overflow-hidden rounded-xl border border-border-grey bg-white">
        <EditorToolbar />
        <div className="relative min-h-[180px]">
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="min-h-[180px] px-4 py-3 text-sm focus:outline-none" />
            }
            placeholder={
              <div className="pointer-events-none absolute top-3 left-4 text-sm text-dark-grey/60">
                Tulis deskripsi produk di sini...
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        <ListPlugin />
        <OnChangePlugin
          ignoreSelectionChange={true}
          onChange={(editorState) => {
            onChange(stringifyEditorState(editorState.toJSON()));
          }}
        />
      </div>
    </LexicalComposer>
  );
}
