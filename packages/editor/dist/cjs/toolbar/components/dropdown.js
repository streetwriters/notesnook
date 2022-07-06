"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dropdown = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const rebass_1 = require("rebass");
const icon_1 = require("./icon");
const icons_1 = require("../icons");
const toolbarstore_1 = require("../stores/toolbarstore");
const menu_1 = require("../../components/menu");
const dom_1 = require("../utils/dom");
function Dropdown(props) {
    const { items, selectedItem, buttonRef, menuWidth } = props;
    const internalRef = (0, react_1.useRef)();
    const [isOpen, setIsOpen] = (0, react_1.useState)(false);
    const toolbarLocation = (0, toolbarstore_1.useToolbarLocation)();
    const isMobile = (0, toolbarstore_1.useIsMobile)();
    const isBottom = toolbarLocation === "bottom";
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)(rebass_1.Button, Object.assign({ ref: (ref) => {
                    internalRef.current = ref;
                    if (buttonRef)
                        buttonRef.current = ref;
                }, sx: {
                    p: 1,
                    m: 0,
                    bg: isOpen ? "hover" : "transparent",
                    mr: 1,
                    display: "flex",
                    alignItems: "center",
                    ":hover": { bg: "hover" },
                    ":last-of-type": {
                        mr: 0,
                    },
                }, onClick: () => setIsOpen((s) => !s), onMouseDown: (e) => e.preventDefault() }, { children: [typeof selectedItem === "string" ? ((0, jsx_runtime_1.jsx)(rebass_1.Text, Object.assign({ sx: { fontSize: "subBody", mr: 1, color: "text" } }, { children: selectedItem }))) : (selectedItem), (0, jsx_runtime_1.jsx)(icon_1.Icon, { path: isBottom ? icons_1.Icons.chevronUp : icons_1.Icons.chevronDown, size: "small", color: "text" })] })), (0, jsx_runtime_1.jsx)(menu_1.MenuPresenter, { isOpen: isOpen, items: items, onClose: () => setIsOpen(false), position: {
                    target: isBottom
                        ? (0, dom_1.getToolbarElement)()
                        : internalRef.current || "mouse",
                    isTargetAbsolute: true,
                    location: isBottom ? "top" : "below",
                    align: "center",
                    yOffset: 5,
                }, blocking: !isMobile, focusOnRender: !isMobile, sx: {
                    minWidth: menuWidth,
                    maxWidth: isBottom ? "95vw" : "auto",
                    flexDirection: isBottom ? "row" : "column",
                    overflowX: isBottom ? "auto" : "hidden",
                    marginRight: isBottom ? "10px" : 0,
                    display: "flex",
                    alignItems: isBottom ? "center" : "unset",
                    mr: isBottom ? 0 : 2,
                } })] }));
}
exports.Dropdown = Dropdown;
