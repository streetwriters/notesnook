"use strict";
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
exports.usePermissionHandler = exports.Toolbar = exports.useTiptap = void 0;
require("./extensions");
const extension_character_count_1 = __importDefault(require("@tiptap/extension-character-count"));
const extension_placeholder_1 = __importDefault(require("@tiptap/extension-placeholder"));
const extension_underline_1 = __importDefault(require("@tiptap/extension-underline"));
const starter_kit_1 = __importDefault(require("@tiptap/starter-kit"));
const react_1 = require("react");
const prosemirror_view_1 = require("prosemirror-view");
const toolbar_1 = __importDefault(require("./toolbar"));
exports.Toolbar = toolbar_1.default;
const extension_text_align_1 = __importDefault(require("@tiptap/extension-text-align"));
const extension_subscript_1 = __importDefault(require("@tiptap/extension-subscript"));
const extension_superscript_1 = __importDefault(require("@tiptap/extension-superscript"));
const fontsize_1 = __importDefault(require("./extensions/fontsize"));
const textdirection_1 = __importDefault(require("./extensions/textdirection"));
const extension_text_style_1 = __importDefault(require("@tiptap/extension-text-style"));
const extension_font_family_1 = __importDefault(require("@tiptap/extension-font-family"));
const bulletlist_1 = __importDefault(require("./extensions/bulletlist"));
const orderedlist_1 = __importDefault(require("./extensions/orderedlist"));
const extension_highlight_1 = __importDefault(require("@tiptap/extension-highlight"));
const extension_color_1 = __importDefault(require("@tiptap/extension-color"));
const extension_table_row_1 = __importDefault(require("@tiptap/extension-table-row"));
const tablecell_1 = __importDefault(require("./extensions/tablecell"));
const extension_table_header_1 = __importDefault(require("@tiptap/extension-table-header"));
const image_1 = require("./extensions/image");
const attachment_1 = require("./extensions/attachment");
const tasklist_1 = require("./extensions/tasklist");
const taskitem_1 = require("./extensions/taskitem");
const dropcursor_1 = require("./extensions/dropcursor");
const searchreplace_1 = require("./extensions/searchreplace");
const embed_1 = require("./extensions/embed");
const codeblock_1 = require("./extensions/codeblock");
const listitem_1 = require("./extensions/listitem");
const extension_link_1 = require("@tiptap/extension-link");
const codemark_1 = require("./extensions/codemark");
const math_1 = require("./extensions/math");
const react_2 = require("./extensions/react");
const outlinelist_1 = require("./extensions/outlinelist");
const outlinelistitem_1 = require("./extensions/outlinelistitem");
const keepinview_1 = require("./extensions/keepinview");
const selectionpersist_1 = require("./extensions/selectionpersist");
const table_1 = require("./extensions/table");
const toolbarstore_1 = require("./toolbar/stores/toolbarstore");
const useEditor_1 = require("./hooks/useEditor");
const usePermissionHandler_1 = require("./hooks/usePermissionHandler");
Object.defineProperty(exports, "usePermissionHandler", { enumerable: true, get: function () { return usePermissionHandler_1.usePermissionHandler; } });
prosemirror_view_1.EditorView.prototype.updateState = function updateState(state) {
    if (!this.docView)
        return; // This prevents the matchesNode error on hot reloads
    this.updateStateInner(state, this.state.plugins != state.plugins);
};
const useTiptap = (options = {}, deps = []) => {
    const { theme, isMobile, onDownloadAttachment, onOpenAttachmentPicker, onBeforeCreate } = options, restOptions = __rest(options, ["theme", "isMobile", "onDownloadAttachment", "onOpenAttachmentPicker", "onBeforeCreate"]);
    const PortalProviderAPI = (0, react_2.usePortalProvider)();
    const setIsMobile = (0, toolbarstore_1.useToolbarStore)((store) => store.setIsMobile);
    const setTheme = (0, toolbarstore_1.useToolbarStore)((store) => store.setTheme);
    (0, react_1.useEffect)(() => {
        setIsMobile(isMobile || false);
        setTheme(theme);
    }, [isMobile, theme]);
    const defaultOptions = (0, react_1.useMemo)(() => ({
        extensions: [
            react_2.NodeViewSelectionNotifier,
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
                onDownloadAttachment,
                onOpenAttachmentPicker,
            }),
            outlinelistitem_1.OutlineListItem,
            outlinelist_1.OutlineList,
            listitem_1.ListItem,
            codemark_1.Codemark,
            math_1.MathInline,
            math_1.MathBlock,
            keepinview_1.KeepInView,
            selectionpersist_1.SelectionPersist,
        ],
        onBeforeCreate: ({ editor }) => {
            editor.storage.portalProviderAPI = PortalProviderAPI;
            if (onBeforeCreate)
                onBeforeCreate({ editor });
        },
        injectCSS: false,
    }), [
        onDownloadAttachment,
        onOpenAttachmentPicker,
        PortalProviderAPI,
        onBeforeCreate,
    ]);
    const editor = (0, useEditor_1.useEditor)(Object.assign(Object.assign({}, defaultOptions), restOptions), deps);
    return editor;
};
exports.useTiptap = useTiptap;
__exportStar(require("./types"), exports);
__exportStar(require("./extensions/react"), exports);
__exportStar(require("./toolbar"), exports);
