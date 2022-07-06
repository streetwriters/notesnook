"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MoreTools = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const popuppresenter_1 = require("../../components/popuppresenter");
const toolbutton_1 = require("../components/toolbutton");
const toolbarstore_1 = require("../stores/toolbarstore");
const dom_1 = require("../utils/dom");
const toolbargroup_1 = require("./toolbargroup");
function MoreTools(props) {
    const { popupId, editor, tools, autoCloseOnUnmount } = props;
    const toolbarLocation = (0, toolbarstore_1.useToolbarLocation)();
    const isBottom = toolbarLocation === "bottom";
    const buttonRef = (0, react_1.useRef)();
    const [isOpen, setIsOpen] = (0, react_1.useState)(false);
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, Object.assign({}, props, { toggled: isOpen, buttonRef: buttonRef, onClick: () => setIsOpen((s) => !s) })), (0, jsx_runtime_1.jsx)(popuppresenter_1.PopupWrapper, { isOpen: isOpen, group: "toolbarGroup", id: popupId, onClosed: () => setIsOpen(false), position: {
                    isTargetAbsolute: true,
                    target: isBottom ? (0, dom_1.getToolbarElement)() : buttonRef.current || "mouse",
                    align: "center",
                    location: isBottom ? "top" : "below",
                    yOffset: isBottom ? 10 : 5,
                }, autoCloseOnUnmount: autoCloseOnUnmount, focusOnRender: false, blocking: false, renderPopup: () => ((0, jsx_runtime_1.jsx)(toolbargroup_1.ToolbarGroup, { tools: tools, editor: editor, sx: {
                        flex: 1,
                        // this is intentionally set to a fixed value
                        // because we want the same padding on mobile
                        // and web.
                        p: "5px",
                        boxShadow: "menu",
                        bg: "background",
                        borderRadius: "default",
                        overflowX: "auto",
                        maxWidth: "95vw",
                    } })) })] }));
}
exports.MoreTools = MoreTools;
