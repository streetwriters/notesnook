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

import {
  EditorOptions,
  extensions as TiptapCoreExtensions,
  getHTMLFromFragment
} from "@tiptap/core";
import CharacterCount from "@tiptap/extension-character-count";
import { Code } from "@tiptap/extension-code";
import Color from "@tiptap/extension-color";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import { Link } from "./extensions/link";
import Placeholder from "@tiptap/extension-placeholder";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TableHeader from "./extensions/table-header";
import TableRow from "@tiptap/extension-table-row";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useMemo } from "react";
import "./extensions";
import { AttachmentNode, AttachmentOptions } from "./extensions/attachment";
import BulletList from "./extensions/bullet-list";
import { CodeBlock } from "./extensions/code-block";
import { Codemark } from "./extensions/code-mark";
import { DateTime, DateTimeOptions } from "./extensions/date-time";
import { EmbedNode } from "./extensions/embed";
import FontFamily from "./extensions/font-family";
import FontSize from "./extensions/font-size";
import { Highlight } from "./extensions/highlight";
import { ImageNode, ImageOptions } from "./extensions/image";
import { KeepInView } from "./extensions/keep-in-view";
import { KeyMap } from "./extensions/key-map";
import { ListItem } from "./extensions/list-item";
import { MathBlock, MathInline } from "./extensions/math";
import { OpenLink, OpenLinkOptions } from "./extensions/open-link";
import OrderedList from "./extensions/ordered-list";
import { OutlineList } from "./extensions/outline-list";
import { OutlineListItem } from "./extensions/outline-list-item";
import { Paragraph } from "./extensions/paragraph";
import {
  NodeViewSelectionNotifier,
  usePortalProvider
} from "./extensions/react";
import { SearchReplace } from "./extensions/search-replace";
import { Table } from "./extensions/table";
import TableCell from "./extensions/table-cell";
import { TaskItemNode } from "./extensions/task-item";
import { TaskListNode } from "./extensions/task-list";
import TextDirection from "./extensions/text-direction";
import { WebClipNode, WebClipOptions } from "./extensions/web-clip";
import { useEditor } from "./hooks/use-editor";
import { usePermissionHandler } from "./hooks/use-permission-handler";
import Toolbar from "./toolbar";
import { useToolbarStore } from "./toolbar/stores/toolbar-store";
import { DownloadOptions } from "./utils/downloader";
import { Heading } from "./extensions/heading";
import Clipboard, { ClipboardOptions } from "./extensions/clipboard";
import Blockquote from "./extensions/blockquote";

declare global {
  // eslint-disable-next-line no-var
  var keyboardShown: boolean;
}

function hasStyle(element: HTMLElement | string) {
  const style = (element as HTMLElement).getAttribute("style");
  if (!style || style === "font-family: inherit;") return false;
  return true;
}

globalThis["keyboardShown"] = true;
const CoreExtensions = Object.entries(TiptapCoreExtensions)
  // we will implement our own customized clipboard serializer
  .filter(([name]) => name !== "ClipboardTextSerializer")
  .map(([, extension]) => extension);

export type TiptapOptions = EditorOptions &
  Omit<AttachmentOptions, "HTMLAttributes"> &
  Omit<WebClipOptions, "HTMLAttributes"> &
  Omit<ImageOptions, "HTMLAttributes"> &
  DateTimeOptions &
  ClipboardOptions &
  OpenLinkOptions & {
    downloadOptions?: DownloadOptions;
    isMobile?: boolean;
    doubleSpacedLines?: boolean;
  };

const useTiptap = (
  options: Partial<TiptapOptions>,
  deps: React.DependencyList = []
) => {
  const {
    doubleSpacedLines = true,
    isMobile,
    onDownloadAttachment,
    onOpenAttachmentPicker,
    onPreviewAttachment,
    onOpenLink,
    onBeforeCreate,
    downloadOptions,
    dateFormat,
    timeFormat,
    copyToClipboard,
    editorProps,
    ...restOptions
  } = options;
  const PortalProviderAPI = usePortalProvider();
  const setIsMobile = useToolbarStore((store) => store.setIsMobile);
  const closeAllPopups = useToolbarStore((store) => store.closeAllPopups);
  const setDownloadOptions = useToolbarStore(
    (store) => store.setDownloadOptions
  );

  useEffect(() => {
    setIsMobile(isMobile || false);
    setDownloadOptions(downloadOptions);
  }, [isMobile, downloadOptions]);

  useEffect(() => {
    closeAllPopups();
  }, deps);

  const defaultOptions = useMemo<Partial<EditorOptions>>(
    () => ({
      enableCoreExtensions: false,
      editorProps: {
        ...editorProps
      },
      extensions: [
        ...CoreExtensions,
        NodeViewSelectionNotifier,
        SearchReplace,
        TextStyle.extend({
          parseHTML() {
            return [
              {
                tag: "span",
                getAttrs: (element) => {
                  if (!hasStyle(element)) {
                    return false;
                  }
                  return {};
                }
              }
            ];
          }
        }),
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
          heading: false,
          blockquote: false,
          history: {
            depth: 200,
            newGroupDelay: 1000
          },
          dropcursor: {
            class: "drop-cursor"
          },
          horizontalRule: false
        }),
        Heading,
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
        Blockquote,
        CharacterCount,
        Underline,
        Subscript,
        Superscript,
        FontSize,
        TextDirection,
        FontFamily,
        BulletList.configure({ keepMarks: true, keepAttributes: true }),
        OrderedList.configure({ keepMarks: true, keepAttributes: true }),
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
        Clipboard.configure({
          copyToClipboard
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
          onOpenAttachmentPicker,
          onPreviewAttachment
        }),
        OutlineListItem,
        OutlineList.configure({ keepAttributes: true, keepMarks: true }),
        ListItem,
        Code.extend({ excludes: "" }),
        Codemark,
        MathInline,
        MathBlock,
        KeepInView.configure({
          scrollIntoViewOnWindowResize: !isMobile
        }),
        DateTime.configure({ dateFormat, timeFormat }),
        KeyMap,
        WebClipNode
      ],
      onBeforeCreate: ({ editor }) => {
        editor.storage.portalProviderAPI = PortalProviderAPI;
        if (onBeforeCreate) onBeforeCreate({ editor });
      },
      injectCSS: false,
      parseOptions: { preserveWhitespace: true }
    }),
    [
      onPreviewAttachment,
      onDownloadAttachment,
      onOpenAttachmentPicker,
      PortalProviderAPI,
      onBeforeCreate,
      onOpenLink,
      dateFormat,
      timeFormat,
      editorProps,
      copyToClipboard
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

export { type Fragment } from "prosemirror-model";
export { type Attachment, type AttachmentType } from "./extensions/attachment";
export * from "./extensions/react";
export * from "./toolbar";
export * from "./types";
export * from "./utils/word-counter";
export * from "./utils/font";
export {
  useTiptap,
  Toolbar,
  usePermissionHandler,
  getHTMLFromFragment,
  type DownloadOptions
};
