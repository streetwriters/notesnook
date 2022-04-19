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
import CharacterCount from "@tiptap/extension-character-count";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useMemo } from "react";
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
import Link from "@tiptap/extension-link";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "./extensions/table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { ImageNode } from "./extensions/image";
import { useTheme } from "@notesnook/theme";
import { AttachmentNode } from "./extensions/attachment";
EditorView.prototype.updateState = function updateState(state) {
    if (!this.docView)
        return; // This prevents the matchesNode error on hot reloads
    this.updateStateInner(state, this.state.plugins != state.plugins);
};
var useTiptap = function (options, deps) {
    if (options === void 0) { options = {}; }
    var theme = options.theme, accent = options.accent, scale = options.scale, onCreate = options.onCreate, onDownloadAttachment = options.onDownloadAttachment, restOptions = __rest(options, ["theme", "accent", "scale", "onCreate", "onDownloadAttachment"]);
    var defaultOptions = useMemo(function () { return ({
        extensions: [
            TextStyle,
            StarterKit,
            CharacterCount,
            Underline,
            Subscript,
            Superscript,
            FontSize,
            TextDirection,
            FontFamily,
            BulletList,
            OrderedList,
            Link,
            ImageNode,
            Table.configure({
                resizable: true,
                allowTableNodeSelection: true,
            }),
            TableRow,
            TableCell,
            TableHeader,
            Highlight.configure({
                multicolor: true,
            }),
            Color,
            TextAlign.configure({
                types: ["heading", "paragraph"],
                alignments: ["left", "right", "center", "justify"],
                defaultAlignment: "left",
            }),
            Placeholder.configure({
                placeholder: "Start writing your note...",
            }),
            AttachmentNode.configure({
                onDownloadAttachment: onDownloadAttachment,
            }),
        ],
        onCreate: function (_a) {
            var editor = _a.editor;
            if (theme && accent && scale) {
                editor.storage.theme = useTheme({ theme: theme, accent: accent, scale: scale });
            }
            if (onCreate)
                onCreate({ editor: editor });
        },
    }); }, [theme, accent, scale, onCreate, onDownloadAttachment]);
    var editor = useEditor(__assign(__assign({}, defaultOptions), restOptions), deps);
    /**
     * Add editor to global for use in React Native.
     */
    global.editor = editor;
    return editor;
};
export { useTiptap, Toolbar };
