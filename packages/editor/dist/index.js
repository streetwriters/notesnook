var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import "./extensions";
import CharacterCount from "@tiptap/extension-character-count";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { useEditor } from "@tiptap/react";
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
import { AttachmentNode } from "./extensions/attachment";
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
import { NodeViewSelectionNotifier, usePortalProvider, } from "./extensions/react";
import { OutlineList } from "./extensions/outline-list";
import { OutlineListItem } from "./extensions/outline-list-item";
import { Table } from "./extensions/table";
import { useIsMobile } from "./toolbar/stores/toolbar-store";
EditorView.prototype.updateState = function updateState(state) {
    if (!this.docView)
        return; // This prevents the matchesNode error on hot reloads
    this.updateStateInner(state, this.state.plugins != state.plugins);
};
var useTiptap = function (options, deps) {
    if (options === void 0) { options = {}; }
    if (deps === void 0) { deps = []; }
    var theme = options.theme, onDownloadAttachment = options.onDownloadAttachment, onOpenAttachmentPicker = options.onOpenAttachmentPicker, restOptions = __rest(options, ["theme", "onDownloadAttachment", "onOpenAttachmentPicker"]);
    var PortalProviderAPI = usePortalProvider();
    var isMobile = useIsMobile();
    var defaultOptions = useMemo(function () { return ({
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
                onDownloadAttachment: onDownloadAttachment,
                onOpenAttachmentPicker: onOpenAttachmentPicker,
            }),
            OutlineListItem,
            OutlineList,
            ListItem,
            Codemark,
            MathInline,
            MathBlock,
        ],
        onBeforeCreate: function (_a) {
            var editor = _a.editor;
            if (theme) {
                editor.storage.theme = theme;
            }
            editor.storage.portalProviderAPI = PortalProviderAPI;
        },
        injectCSS: false,
    }); }, [
        theme,
        onDownloadAttachment,
        onOpenAttachmentPicker,
        PortalProviderAPI,
        isMobile,
    ]);
    var editor = useEditor(__assign(__assign({}, defaultOptions), restOptions), deps);
    var editorRef = useRef(editor);
    useEffect(function () {
        editorRef.current = editor;
        if (editor && !editor.current)
            Object.defineProperty(editor, "current", {
                get: function () { return editorRef.current; },
            });
    }, [editor]);
    useEffect(function () {
        function onDragEnter(event) {
            if (!!(editor === null || editor === void 0 ? void 0 : editor.view.dragging)) {
                event.preventDefault();
                return true;
            }
        }
        editor === null || editor === void 0 ? void 0 : editor.view.dom.addEventListener("dragenter", onDragEnter);
        return function () {
            editor === null || editor === void 0 ? void 0 : editor.view.dom.removeEventListener("dragenter", onDragEnter);
        };
    }, [editor === null || editor === void 0 ? void 0 : editor.view.dom]);
    return editor;
};
export { useTiptap, Toolbar };
export * from "./types";
export * from "./extensions/react";
export * from "./toolbar/tool-definitions";
