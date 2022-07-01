"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbedProperties = exports.EmbedAlignCenter = exports.EmbedAlignRight = exports.EmbedAlignLeft = exports.EmbedSettings = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const toolbutton_1 = require("../components/toolbutton");
const react_1 = require("react");
const responsive_1 = require("../../components/responsive");
const moretools_1 = require("../components/moretools");
const toolbarstore_1 = require("../stores/toolbarstore");
const prosemirror_1 = require("../utils/prosemirror");
const embedpopup_1 = require("../popups/embedpopup");
function EmbedSettings(props) {
    const { editor } = props;
    const isBottom = (0, toolbarstore_1.useToolbarLocation)() === "bottom";
    if (!editor.isActive("embed") || !isBottom)
        return null;
    return ((0, jsx_runtime_1.jsx)(moretools_1.MoreTools, Object.assign({}, props, { autoCloseOnUnmount: true, popupId: "embedSettings", tools: [] })));
}
exports.EmbedSettings = EmbedSettings;
function EmbedAlignLeft(props) {
    const { editor } = props;
    return ((0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, Object.assign({}, props, { toggled: false, onClick: () => {
            var _a;
            return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().setEmbedAlignment({ align: "left" }).run();
        } })));
}
exports.EmbedAlignLeft = EmbedAlignLeft;
function EmbedAlignRight(props) {
    const { editor } = props;
    return ((0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, Object.assign({}, props, { toggled: false, onClick: () => {
            var _a;
            return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().setEmbedAlignment({ align: "right" }).run();
        } })));
}
exports.EmbedAlignRight = EmbedAlignRight;
function EmbedAlignCenter(props) {
    const { editor } = props;
    return ((0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, Object.assign({}, props, { toggled: false, onClick: () => {
            var _a;
            return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().setEmbedAlignment({ align: "center" }).run();
        } })));
}
exports.EmbedAlignCenter = EmbedAlignCenter;
// TODO: stop re-rendering
function EmbedProperties(props) {
    const { editor } = props;
    const [isOpen, setIsOpen] = (0, react_1.useState)(false);
    const buttonRef = (0, react_1.useRef)();
    // TODO: improve perf by deferring this until user opens the popup
    const embedNode = (0, react_1.useMemo)(() => (0, prosemirror_1.findSelectedNode)(editor, "embed"), []);
    const embed = ((embedNode === null || embedNode === void 0 ? void 0 : embedNode.attrs) || {});
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, Object.assign({ buttonRef: buttonRef, toggled: isOpen }, props, { onClick: () => setIsOpen((s) => !s) })), (0, jsx_runtime_1.jsx)(responsive_1.ResponsivePresenter, Object.assign({ isOpen: isOpen, desktop: "menu", mobile: "sheet", onClose: () => setIsOpen(false), blocking: true, focusOnRender: false, position: {
                    target: buttonRef.current || "mouse",
                    align: "start",
                    location: "below",
                    yOffset: 10,
                    isTargetAbsolute: true,
                } }, { children: (0, jsx_runtime_1.jsx)(embedpopup_1.EmbedPopup, { title: "Embed properties", onClose: () => setIsOpen(false), embed: embed, onSourceChanged: (src) => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.commands.setEmbedSource(src); }, onSizeChanged: (size) => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.commands.setEmbedSize(size); } }) }))] }));
}
exports.EmbedProperties = EmbedProperties;
