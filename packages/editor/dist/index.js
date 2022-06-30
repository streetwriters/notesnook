"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Toolbar = exports.useTiptap = void 0;
require("./extensions");
var extension_character_count_1 = __importDefault(require("@tiptap/extension-character-count"));
var extension_placeholder_1 = __importDefault(require("@tiptap/extension-placeholder"));
var extension_underline_1 = __importDefault(require("@tiptap/extension-underline"));
var react_1 = require("@tiptap/react");
var starter_kit_1 = __importDefault(require("@tiptap/starter-kit"));
var react_2 = require("react");
var prosemirror_view_1 = require("prosemirror-view");
var toolbar_1 = __importDefault(require("./toolbar"));
exports.Toolbar = toolbar_1.default;
var extension_text_align_1 = __importDefault(require("@tiptap/extension-text-align"));
var extension_subscript_1 = __importDefault(require("@tiptap/extension-subscript"));
var extension_superscript_1 = __importDefault(require("@tiptap/extension-superscript"));
var fontsize_1 = __importDefault(require("./extensions/fontsize"));
var textdirection_1 = __importDefault(require("./extensions/textdirection"));
var extension_text_style_1 = __importDefault(require("@tiptap/extension-text-style"));
var extension_font_family_1 = __importDefault(require("@tiptap/extension-font-family"));
var bulletlist_1 = __importDefault(require("./extensions/bulletlist"));
var orderedlist_1 = __importDefault(require("./extensions/orderedlist"));
var extension_highlight_1 = __importDefault(require("@tiptap/extension-highlight"));
var extension_color_1 = __importDefault(require("@tiptap/extension-color"));
var extension_table_row_1 = __importDefault(require("@tiptap/extension-table-row"));
var tablecell_1 = __importDefault(require("./extensions/tablecell"));
var extension_table_header_1 = __importDefault(require("@tiptap/extension-table-header"));
var image_1 = require("./extensions/image");
var attachment_1 = require("./extensions/attachment");
var tasklist_1 = require("./extensions/tasklist");
var taskitem_1 = require("./extensions/taskitem");
var dropcursor_1 = require("./extensions/dropcursor");
var searchreplace_1 = require("./extensions/searchreplace");
var embed_1 = require("./extensions/embed");
var codeblock_1 = require("./extensions/codeblock");
var listitem_1 = require("./extensions/listitem");
var extension_link_1 = require("@tiptap/extension-link");
var codemark_1 = require("./extensions/codemark");
var math_1 = require("./extensions/math");
var react_3 = require("./extensions/react");
var outlinelist_1 = require("./extensions/outlinelist");
var outlinelistitem_1 = require("./extensions/outlinelistitem");
var table_1 = require("./extensions/table");
var toolbarstore_1 = require("./toolbar/stores/toolbarstore");
prosemirror_view_1.EditorView.prototype.updateState = function updateState(state) {
    if (!this.docView)
        return; // This prevents the matchesNode error on hot reloads
    this.updateStateInner(state, this.state.plugins != state.plugins);
};
var useTiptap = function (options, deps) {
    if (options === void 0) { options = {}; }
    if (deps === void 0) { deps = []; }
    var theme = options.theme, onDownloadAttachment = options.onDownloadAttachment, onOpenAttachmentPicker = options.onOpenAttachmentPicker, restOptions = __rest(options, ["theme", "onDownloadAttachment", "onOpenAttachmentPicker"]);
    var PortalProviderAPI = (0, react_3.usePortalProvider)();
    var isMobile = (0, toolbarstore_1.useIsMobile)();
    var defaultOptions = (0, react_2.useMemo)(function () { return ({
        extensions: [
            react_3.NodeViewSelectionNotifier,
            searchreplace_1.SearchReplace,
            extension_text_style_1.default,
            starter_kit_1.default.configure({
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
            dropcursor_1.Dropcursor.configure({
                class: "drop-cursor",
            }),
            extension_character_count_1.default,
            extension_underline_1.default,
            extension_subscript_1.default,
            extension_superscript_1.default,
            fontsize_1.default,
            textdirection_1.default,
            extension_font_family_1.default,
            bulletlist_1.default,
            orderedlist_1.default,
            taskitem_1.TaskItemNode.configure({ nested: true }),
            tasklist_1.TaskListNode,
            extension_link_1.Link.configure({ openOnClick: !isMobile }),
            table_1.Table.configure({
                resizable: true,
                allowTableNodeSelection: true,
                cellMinWidth: 50,
            }),
            extension_table_row_1.default,
            tablecell_1.default,
            extension_table_header_1.default,
            extension_highlight_1.default.configure({
                multicolor: true,
            }),
            codeblock_1.CodeBlock,
            extension_color_1.default,
            extension_text_align_1.default.configure({
                types: ["heading", "paragraph"],
                alignments: ["left", "right", "center", "justify"],
                defaultAlignment: "left",
            }),
            extension_placeholder_1.default.configure({
                placeholder: "Start writing your note...",
            }),
            image_1.ImageNode,
            embed_1.EmbedNode,
            attachment_1.AttachmentNode.configure({
                onDownloadAttachment: onDownloadAttachment,
                onOpenAttachmentPicker: onOpenAttachmentPicker,
            }),
            outlinelistitem_1.OutlineListItem,
            outlinelist_1.OutlineList,
            listitem_1.ListItem,
            codemark_1.Codemark,
            math_1.MathInline,
            math_1.MathBlock,
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
    var editor = (0, react_1.useEditor)(__assign(__assign({}, defaultOptions), restOptions), deps);
    var editorRef = (0, react_2.useRef)(editor);
    (0, react_2.useEffect)(function () {
        editorRef.current = editor;
        if (editor && !editor.current)
            Object.defineProperty(editor, "current", {
                get: function () { return editorRef.current; },
            });
    }, [editor]);
    (0, react_2.useEffect)(function () {
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
exports.useTiptap = useTiptap;
__exportStar(require("./types"), exports);
__exportStar(require("./extensions/react"), exports);
__exportStar(require("./toolbar/tooldefinitions"), exports);
