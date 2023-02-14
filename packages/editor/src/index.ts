/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import "./extensions";
import CharacterCount from "@tiptap/extension-character-count";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useMemo } from "react";
import Toolbar from "./toolbar";
import TextAlign from "@tiptap/extension-text-align";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import FontSize from "./extensions/font-size";
import TextDirection from "./extensions/text-direction";
import TextStyle from "@tiptap/extension-text-style";
import FontFamily from "./extensions/font-family";
import BulletList from "./extensions/bullet-list";
import OrderedList from "./extensions/ordered-list";
import Color from "@tiptap/extension-color";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "./extensions/table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { ImageNode } from "./extensions/image";
import { Theme } from "@notesnook/theme";
import { AttachmentNode, AttachmentOptions } from "./extensions/attachment";
import { TaskListNode } from "./extensions/task-list";
import { TaskItemNode } from "./extensions/task-item";
import { SearchReplace } from "./extensions/search-replace";
import { EmbedNode } from "./extensions/embed";
import { CodeBlock } from "./extensions/code-block";
import { ListItem } from "./extensions/list-item";
import { Link } from "@tiptap/extension-link";
import { Codemark } from "./extensions/code-mark";
import { MathInline, MathBlock } from "./extensions/math";
import {
  NodeViewSelectionNotifier,
  usePortalProvider
} from "./extensions/react";
import { OutlineList } from "./extensions/outline-list";
import { OutlineListItem } from "./extensions/outline-list-item";
import { KeepInView } from "./extensions/keep-in-view";
import { SelectionPersist } from "./extensions/selection-persist";
import { Table } from "./extensions/table";
import { useToolbarStore } from "./toolbar/stores/toolbar-store";
import { useEditor } from "./hooks/use-editor";
import {
  EditorOptions,
  extensions as TiptapCoreExtensions,
  getHTMLFromFragment
} from "@tiptap/core";
import { usePermissionHandler } from "./hooks/use-permission-handler";
import { Highlight } from "./extensions/highlight";
import { Paragraph } from "./extensions/paragraph";
import { ClipboardTextSerializer } from "./extensions/clipboard-text-serializer";
import { Code } from "@tiptap/extension-code";
import { DateTime } from "./extensions/date-time";
import { OpenLink, OpenLinkOptions } from "./extensions/open-link";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import { KeyMap } from "./extensions/key-map";
import { WebClipNode, WebClipOptions } from "./extensions/web-clip";
import { DownloadOptions } from "./utils/downloader";
export { getTotalWords, countWords } from "./utils/word-counter";

const CoreExtensions = Object.entries(TiptapCoreExtensions)
  // we will implement our own customized clipboard serializer
  .filter(([name]) => name !== "ClipboardTextSerializer")
  .map(([, extension]) => extension);

type TiptapOptions = EditorOptions &
  Omit<AttachmentOptions, "HTMLAttributes"> &
  Omit<WebClipOptions, "HTMLAttributes"> &
  OpenLinkOptions & {
    downloadOptions?: DownloadOptions;
    theme: Theme;
    isMobile?: boolean;
    isKeyboardOpen?: boolean;
    doubleSpacedLines?: boolean;
  };

const useTiptap = (
  options: Partial<TiptapOptions> = {},
  deps: React.DependencyList = []
) => {
  const {
    theme,
    doubleSpacedLines = true,
    isMobile,
    isKeyboardOpen,
    onDownloadAttachment,
    onOpenAttachmentPicker,
    onOpenLink,
    onBeforeCreate,
    downloadOptions,
    ...restOptions
  } = options;
  const PortalProviderAPI = usePortalProvider();
  const setIsMobile = useToolbarStore((store) => store.setIsMobile);
  const setTheme = useToolbarStore((store) => store.setTheme);
  const closeAllPopups = useToolbarStore((store) => store.closeAllPopups);
  const setIsKeyboardOpen = useToolbarStore((store) => store.setIsKeyboardOpen);
  const setDownloadOptions = useToolbarStore(
    (store) => store.setDownloadOptions
  );

  useEffect(() => {
    setIsMobile(isMobile || false);
    setTheme(theme);
    setIsKeyboardOpen(isKeyboardOpen || false);
    setDownloadOptions(downloadOptions);
  }, [isMobile, theme, isKeyboardOpen, downloadOptions]);

  useEffect(() => {
    closeAllPopups();
  }, deps);

  const defaultOptions = useMemo<Partial<EditorOptions>>(
    () => ({
      enableCoreExtensions: false,
      extensions: [
        ...CoreExtensions,
        ClipboardTextSerializer,
        NodeViewSelectionNotifier,
        SearchReplace,
        TextStyle,
        Paragraph.configure({
          doubleSpaced: doubleSpacedLines
        }),
        StarterKit.configure({
          code: false,
          codeBlock: false,
          listItem: false,
          orderedList: false,
          bulletList: false,
          paragraph: false,
          hardBreak: false,
          history: {
            depth: 200,
            newGroupDelay: 1000
          },
          dropcursor: {
            class: "drop-cursor"
          },
          horizontalRule: false
        }),
        HorizontalRule.extend({
          addInputRules() {
            return [
              {
                find: /^(?:---|—-|___\s|\*\*\*\s)$/,
                handler: ({ state, range, commands }) => {
                  commands.splitBlock();

                  const attributes = {};
                  const { tr } = state;
                  const start = range.from;
                  const end = range.to;
                  tr.replaceWith(start - 1, end, this.type.create(attributes));
                }
              }
            ];
          }
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
        Link.extend({
          inclusive: true
        }).configure({
          openOnClick: !isMobile,
          autolink: false
        }),
        Table.configure({
          resizable: true,
          allowTableNodeSelection: true,
          cellMinWidth: 50
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
          defaultAlignment: "left"
        }),
        Placeholder.configure({
          placeholder: "Start writing your note..."
        }),
        OpenLink.configure({
          onOpenLink
        }),
        ImageNode.configure({ allowBase64: true }),
        EmbedNode,
        AttachmentNode.configure({
          onDownloadAttachment,
          onOpenAttachmentPicker
        }),
        OutlineListItem,
        OutlineList,
        ListItem,
        Code.extend({ excludes: "" }),
        Codemark,
        MathInline,
        MathBlock,
        KeepInView,
        SelectionPersist,
        DateTime,
        KeyMap,
        WebClipNode
      ],
      onBeforeCreate: ({ editor }) => {
        editor.storage.portalProviderAPI = PortalProviderAPI;
        if (onBeforeCreate) onBeforeCreate({ editor });
      },
      injectCSS: false
    }),
    [
      onDownloadAttachment,
      onOpenAttachmentPicker,
      PortalProviderAPI,
      onBeforeCreate,
      onOpenLink
    ]
  );

  const editor = useEditor(
    {
      ...defaultOptions,
      ...restOptions
    },
    deps
  );

  return editor;
};

export {
  useTiptap,
  Toolbar,
  usePermissionHandler,
  getHTMLFromFragment,
  type DownloadOptions
};
export * from "./types";
export * from "./extensions/react";
export * from "./toolbar";
export { type AttachmentType, type Attachment } from "./extensions/attachment";
export { type Fragment } from "prosemirror-model";
