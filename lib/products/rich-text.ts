import type { SerializedEditorState } from "lexical";

type LexicalRoot = {
  children: Array<unknown>;
  direction: "ltr" | "rtl" | null;
  format: string;
  indent: number;
  type: "root";
  version: number;
};

type MinimalLexicalState = {
  root: LexicalRoot;
};

function createParagraphStateFromText(text: string): SerializedEditorState {
  return {
    root: {
      children: [
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: "normal",
              style: "",
              text,
              type: "text",
              version: 1,
            },
          ],
          direction: "ltr",
          format: "",
          indent: 0,
          type: "paragraph",
          version: 1,
          textFormat: 0,
          textStyle: "",
        },
      ],
      direction: "ltr",
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  } as unknown as SerializedEditorState;
}

function isMinimalLexicalState(value: unknown): value is MinimalLexicalState {
  if (!value || typeof value !== "object") return false;
  const root = (value as { root?: unknown }).root;
  if (!root || typeof root !== "object") return false;
  return (root as { type?: unknown }).type === "root";
}

export function getEmptySerializedEditorState() {
  return createParagraphStateFromText("");
}

export function parseProductDescriptionToEditorState(
  rawDescription: string | null | undefined,
) {
  if (!rawDescription || !rawDescription.trim()) {
    return getEmptySerializedEditorState();
  }

  const candidate = rawDescription.trim();
  if (candidate.startsWith("{")) {
    try {
      const parsed = JSON.parse(candidate) as unknown;
      if (isMinimalLexicalState(parsed)) {
        return parsed as SerializedEditorState;
      }
    } catch {
      // Fallback to plain-text paragraph state.
    }
  }

  return createParagraphStateFromText(rawDescription);
}

export function stringifyEditorState(
  serializedEditorState: SerializedEditorState,
) {
  return JSON.stringify(serializedEditorState);
}
