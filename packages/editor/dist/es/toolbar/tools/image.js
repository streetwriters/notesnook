import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { ToolButton } from "../components/tool-button";
import { useMemo, useRef, useState } from "react";
import { ResponsivePresenter } from "../../components/responsive";
import { MoreTools } from "../components/more-tools";
import { useToolbarLocation } from "../stores/toolbar-store";
import { ImageProperties as ImagePropertiesPopup } from "../popups/image-properties";
import { findSelectedNode } from "../utils/prosemirror";
export function ImageSettings(props) {
    var _a, _b;
    const { editor } = props;
    const isBottom = useToolbarLocation() === "bottom";
    if (!editor.isActive("image") || !isBottom)
        return null;
    return (_jsx(MoreTools, Object.assign({}, props, { autoCloseOnUnmount: true, popupId: "imageSettings", tools: ((_b = (_a = findSelectedNode(editor, "image")) === null || _a === void 0 ? void 0 : _a.attrs) === null || _b === void 0 ? void 0 : _b.float)
            ? ["imageAlignLeft", "imageAlignRight", "imageProperties"]
            : [
                "imageAlignLeft",
                "imageAlignCenter",
                "imageAlignRight",
                "imageProperties",
            ] })));
}
export function ImageAlignLeft(props) {
    const { editor } = props;
    return (_jsx(ToolButton, Object.assign({}, props, { toggled: false, onClick: () => {
            var _a;
            return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().setImageAlignment({ align: "left" }).run();
        } })));
}
export function ImageAlignRight(props) {
    const { editor } = props;
    return (_jsx(ToolButton, Object.assign({}, props, { toggled: false, onClick: () => {
            var _a;
            return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().setImageAlignment({ align: "right" }).run();
        } })));
}
export function ImageAlignCenter(props) {
    const { editor } = props;
    return (_jsx(ToolButton, Object.assign({}, props, { toggled: false, onClick: () => {
            var _a;
            return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().setImageAlignment({ align: "center" }).run();
        } })));
}
export function ImageProperties(props) {
    const { editor } = props;
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef();
    // TODO: defer until user opens the popup
    const image = useMemo(() => findSelectedNode(editor, "image"), []);
    const { float, align, width, height } = ((image === null || image === void 0 ? void 0 : image.attrs) ||
        {});
    return (_jsxs(_Fragment, { children: [_jsx(ToolButton, Object.assign({ buttonRef: buttonRef, toggled: isOpen }, props, { onClick: () => setIsOpen((s) => !s) })), _jsx(ResponsivePresenter, Object.assign({ isOpen: isOpen, desktop: "menu", mobile: "sheet", onClose: () => setIsOpen(false), blocking: true, focusOnRender: false, position: {
                    target: buttonRef.current || "mouse",
                    align: "start",
                    location: "below",
                    yOffset: 10,
                    isTargetAbsolute: true,
                } }, { children: _jsx(ImagePropertiesPopup, { editor: editor, height: height, width: width, align: align, float: float, onClose: () => setIsOpen(false) }) }))] }));
}
