import "./extensions";
import CharacterCount from "@tiptap/extension-character-count";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
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
import Color from "@tiptap/extension-color";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "./extensions/table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { ImageNode } from "./extensions/image";
import { Theme } from "@streetwriters/theme";
import { AttachmentNode, AttachmentOptions } from "./extensions/attachment";
import { TaskListNode } from "./extensions/task-list";
import { TaskItemNode } from "./extensions/task-item";
import { Dropcursor } from "./extensions/drop-cursor";
import { SearchReplace } from "./extensions/search-replace";
import { EmbedNode } from "./extensions/embed";
import { CodeBlock } from "./extensions/code-block";
import { ListItem } from "./extensions/list-item";
import { Link } from "@tiptap/extension-link";
import { Codemark } from "./extensions/code-mark";
import { MathInline, MathBlock } from "./extensions/math";
import {
  NodeViewSelectionNotifier,
  usePortalProvider,
} from "./extensions/react";
import { OutlineList } from "./extensions/outline-list";
import { OutlineListItem } from "./extensions/outline-list-item";
import { KeepInView } from "./extensions/keep-in-view";
import { SelectionPersist } from "./extensions/selection-persist";
import { Table } from "./extensions/table";
import { useToolbarStore } from "./toolbar/stores/toolbar-store";
import { useEditor } from "./hooks/use-editor";
import { EditorOptions } from "@tiptap/core";
import { usePermissionHandler } from "./hooks/use-permission-handler";
import { Highlight } from "./extensions/highlight";

EditorView.prototype.updateState = function updateState(state) {
  if (!(this as any).docView) return; // This prevents the matchesNode error on hot reloads
  (this as any).updateStateInner(state, this.state.plugins != state.plugins);
};

type TiptapOptions = EditorOptions &
  AttachmentOptions & {
    theme: Theme;
    isMobile?: boolean;
    isKeyboardOpen?: boolean;
  };

const useTiptap = (
  options: Partial<TiptapOptions> = {},
  deps: React.DependencyList = []
) => {
  const {
    theme,
    isMobile,
    isKeyboardOpen,
    onDownloadAttachment,
    onOpenAttachmentPicker,
    onBeforeCreate,
    ...restOptions
  } = options;
  const PortalProviderAPI = usePortalProvider();
  const setIsMobile = useToolbarStore((store) => store.setIsMobile);
  const setTheme = useToolbarStore((store) => store.setTheme);
  const setIsKeyboardOpen = useToolbarStore((store) => store.setIsKeyboardOpen);

  useEffect(() => {
    setIsMobile(isMobile || false);
    setTheme(theme);
    setIsKeyboardOpen(isKeyboardOpen || false);
  }, [isMobile, theme, isKeyboardOpen]);

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
        Link.configure({ openOnClick: !isMobile, autolink: false }),
        Table.configure({
          resizable: true,
          allowTableNodeSelection: true,
          cellMinWidth: 50,
        }),
        TableRow,
        TableCell,
        TableHeader,
        Highlight,
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
        Codemark,
        MathInline,
        MathBlock,
        KeepInView,
        SelectionPersist,
      ],
      onBeforeCreate: ({ editor }) => {
        editor.storage.portalProviderAPI = PortalProviderAPI;
        if (onBeforeCreate) onBeforeCreate({ editor });
      },
      injectCSS: false,
    }),
    [
      onDownloadAttachment,
      onOpenAttachmentPicker,
      PortalProviderAPI,
      onBeforeCreate,
    ]
  );

  const editor = useEditor(
    {
      ...defaultOptions,
      ...restOptions,
    },
    deps
  );

  return editor;
};

export { useTiptap, Toolbar, usePermissionHandler };
export * from "./types";
export * from "./extensions/react";
export * from "./toolbar";
export { type AttachmentType, type Attachment } from "./extensions/attachment";
