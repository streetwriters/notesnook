import "./extensions";
import CharacterCount from "@tiptap/extension-character-count";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { EditorOptions, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useMemo, useRef } from "react";
import { EditorView } from "prosemirror-view";
import Toolbar from "./toolbar";
import TextAlign from "@tiptap/extension-text-align";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import FontSize from "./extensions/font-size";
import TextDirection from "./extensions/text-direction";
import TextStyle from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import BulletList from "./extensions/bullet-list";
import OrderedList from "./extensions/ordered-list";
import Highlight from "@tiptap/extension-highlight";
import Color from "@tiptap/extension-color";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "./extensions/table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { ImageNode } from "./extensions/image";
import { Theme } from "@notesnook/theme";
import { AttachmentNode, AttachmentOptions } from "./extensions/attachment";
import { TaskListNode } from "./extensions/task-list";
import { TaskItemNode } from "./extensions/task-item";
import { Dropcursor } from "./extensions/drop-cursor";
import { SearchReplace } from "./extensions/search-replace";
import { EmbedNode } from "./extensions/embed";
import { CodeBlock } from "./extensions/code-block";
import { ListItem } from "./extensions/list-item";
import { Link } from "@tiptap/extension-link";
import {
  NodeViewSelectionNotifier,
  usePortalProvider,
} from "./extensions/react";
import { OutlineList } from "./extensions/outline-list";
import { OutlineListItem } from "./extensions/outline-list-item";
import { Table } from "./extensions/table";
import { Editor } from "./types";
import { useIsMobile } from "./toolbar/stores/toolbar-store";

// export class Editor extends TiptapEditor {
//   get instance(): TiptapEditor {}
// }

EditorView.prototype.updateState = function updateState(state) {
  if (!(this as any).docView) return; // This prevents the matchesNode error on hot reloads
  (this as any).updateStateInner(state, this.state.plugins != state.plugins);
};

const useTiptap = (
  options: Partial<EditorOptions & AttachmentOptions & { theme: Theme }> = {},
  deps: React.DependencyList = []
) => {
  const {
    theme,
    onDownloadAttachment,
    onOpenAttachmentPicker,
    ...restOptions
  } = options;
  const PortalProviderAPI = usePortalProvider();
  const isMobile = useIsMobile();

  const defaultOptions = useMemo<Partial<EditorOptions>>(
    () => ({
      extensions: [
        NodeViewSelectionNotifier,
        SearchReplace,
        TextStyle,
        StarterKit.configure({
          dropcursor: false,
          codeBlock: false,
          listItem: false,
          orderedList: false,
          bulletList: false,
          history: {
            depth: 200,
            newGroupDelay: 1000,
          },
        }),
        Dropcursor.configure({
          class: "drop-cursor",
        }),
        CharacterCount,
        Underline,
        Subscript,
        Superscript,
        FontSize,
        TextDirection,
        FontFamily,
        BulletList,
        OrderedList,
        TaskItemNode.configure({ nested: true }),
        TaskListNode,
        Link.configure({ openOnClick: !isMobile }),
        Table.configure({
          resizable: true,
          allowTableNodeSelection: true,
          cellMinWidth: 50,
        }),
        TableRow,
        TableCell,
        TableHeader,
        Highlight.configure({
          multicolor: true,
        }),
        CodeBlock,
        Color,
        TextAlign.configure({
          types: ["heading", "paragraph"],
          alignments: ["left", "right", "center", "justify"],
          defaultAlignment: "left",
        }),
        Placeholder.configure({
          placeholder: "Start writing your note...",
        }),

        ImageNode,
        EmbedNode,
        AttachmentNode.configure({
          onDownloadAttachment,
          onOpenAttachmentPicker,
        }),
        OutlineListItem,
        OutlineList,
        ListItem,
      ],
      onBeforeCreate: ({ editor }) => {
        if (theme) {
          editor.storage.theme = theme;
        }
        editor.storage.portalProviderAPI = PortalProviderAPI;
      },
      injectCSS: false,
    }),
    [
      theme,
      onDownloadAttachment,
      onOpenAttachmentPicker,
      PortalProviderAPI,
      isMobile,
    ]
  );

  const editor = useEditor(
    {
      ...defaultOptions,
      ...restOptions,
    },
    deps
  ) as Editor | null;

  const editorRef = useRef(editor);
  useEffect(() => {
    editorRef.current = editor;

    if (editor && !editor.current)
      Object.defineProperty(editor, "current", {
        get: () => editorRef.current,
      });
  }, [editor]);

  return editor;
};

export { useTiptap, Toolbar };
export * from "./extensions/react";
