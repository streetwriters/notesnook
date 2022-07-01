"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageProperties = exports.ImageAlignCenter = exports.ImageAlignRight = exports.ImageAlignLeft = exports.ImageSettings = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const toolbutton_1 = require("../components/toolbutton");
const react_1 = require("react");
const responsive_1 = require("../../components/responsive");
const moretools_1 = require("../components/moretools");
const toolbarstore_1 = require("../stores/toolbarstore");
const imageproperties_1 = require("../popups/imageproperties");
const prosemirror_1 = require("../utils/prosemirror");
function ImageSettings(props) {
    var _a, _b;
    const { editor } = props;
    const isBottom = (0, toolbarstore_1.useToolbarLocation)() === "bottom";
    if (!editor.isActive("image") || !isBottom)
        return null;
    return ((0, jsx_runtime_1.jsx)(moretools_1.MoreTools, Object.assign({}, props, { autoCloseOnUnmount: true, popupId: "imageSettings", tools: ((_b = (_a = (0, prosemirror_1.findSelectedNode)(editor, "image")) === null || _a === void 0 ? void 0 : _a.attrs) === null || _b === void 0 ? void 0 : _b.float)
            ? ["imageAlignLeft", "imageAlignRight", "imageProperties"]
            : [
                "imageAlignLeft",
                "imageAlignCenter",
                "imageAlignRight",
                "imageProperties",
            ] })));
}
exports.ImageSettings = ImageSettings;
function ImageAlignLeft(props) {
    const { editor } = props;
    return ((0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, Object.assign({}, props, { toggled: false, onClick: () => {
            var _a;
            return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().setImageAlignment({ align: "left" }).run();
        } })));
}
exports.ImageAlignLeft = ImageAlignLeft;
function ImageAlignRight(props) {
    const { editor } = props;
    return ((0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, Object.assign({}, props, { toggled: false, onClick: () => {
            var _a;
            return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().setImageAlignment({ align: "right" }).run();
        } })));
}
exports.ImageAlignRight = ImageAlignRight;
function ImageAlignCenter(props) {
    const { editor } = props;
    return ((0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, Object.assign({}, props, { toggled: false, onClick: () => {
            var _a;
            return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().setImageAlignment({ align: "center" }).run();
        } })));
}
exports.ImageAlignCenter = ImageAlignCenter;
function ImageProperties(props) {
    const { editor } = props;
    const [isOpen, setIsOpen] = (0, react_1.useState)(false);
    const buttonRef = (0, react_1.useRef)();
    // TODO: defer until user opens the popup
    const image = (0, react_1.useMemo)(() => (0, prosemirror_1.findSelectedNode)(editor, "image"), []);
    const { float, align, width, height } = ((image === null || image === void 0 ? void 0 : image.attrs) ||
        {});
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, Object.assign({ buttonRef: buttonRef, toggled: isOpen }, props, { onClick: () => setIsOpen((s) => !s) })), (0, jsx_runtime_1.jsx)(responsive_1.ResponsivePresenter, Object.assign({ isOpen: isOpen, desktop: "menu", mobile: "sheet", onClose: () => setIsOpen(false), blocking: true, focusOnRender: false, position: {
                    target: buttonRef.current || "mouse",
                    align: "start",
                    location: "below",
                    yOffset: 10,
                    isTargetAbsolute: true,
                } }, { children: (0, jsx_runtime_1.jsx)(imageproperties_1.ImageProperties, { editor: editor, height: height, width: width, align: align, float: float, onClose: () => setIsOpen(false) }) }))] }));
}
exports.ImageProperties = ImageProperties;
