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
import { jsx as _jsx } from "react/jsx-runtime";
import { Box, Button, Flex } from "rebass";
import { useCallback, useRef, useState } from "react";
import { SplitButton } from "../components/split-button";
import { useToolbarLocation } from "../stores/toolbar-store";
import { getToolbarElement } from "../utils/dom";
import { PopupWrapper } from "../../components/popup-presenter";
import React from "react";
import { ToolButton } from "../components/tool-button";
import { findListItemType, isListActive } from "../utils/prosemirror";
function _ListTool(props) {
    const { editor, onClick, isActive, subTypes, type } = props, toolProps = __rest(props, ["editor", "onClick", "isActive", "subTypes", "type"]);
    const toolbarLocation = useToolbarLocation();
    const isBottom = toolbarLocation === "bottom";
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef();
    return (_jsx(SplitButton, Object.assign({}, toolProps, { buttonRef: buttonRef, onClick: onClick, toggled: isOpen, sx: { mr: 0 }, onOpen: () => setIsOpen((s) => !s) }, { children: _jsx(PopupWrapper, { isOpen: isOpen, group: "lists", id: toolProps.title, blocking: false, focusOnRender: false, position: {
                isTargetAbsolute: true,
                target: isBottom ? getToolbarElement() : buttonRef.current || "mouse",
                align: "center",
                location: isBottom ? "top" : "below",
                yOffset: 10,
            }, onClosed: () => setIsOpen(false), renderPopup: () => (_jsx(Box, Object.assign({ sx: {
                    bg: "background",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    p: 1,
                } }, { children: subTypes.map((item) => (_jsx(Button, Object.assign({ variant: "menuitem", sx: { width: 80 }, onClick: () => {
                        var _a;
                        let chain = (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus();
                        if (!chain || !editor.current)
                            return;
                        if (!isListActive(editor.current)) {
                            if (type === "bulletList")
                                chain = chain.toggleBulletList();
                            else
                                chain = chain.toggleOrderedList();
                        }
                        return chain
                            .updateAttributes(type, { listType: item.type })
                            .run();
                    } }, { children: _jsx(ListThumbnail, { listStyleType: item.type }) }), item.title))) }))) }) })));
}
const ListTool = React.memo(_ListTool, (prev, next) => {
    return prev.isActive === next.isActive;
});
export function NumberedList(props) {
    const { editor } = props;
    const onClick = useCallback(() => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().toggleOrderedList().run(); }, []);
    return (_jsx(ListTool, Object.assign({}, props, { type: "orderedList", isActive: editor.isActive("orderedList"), onClick: onClick, subTypes: [
            { type: "decimal", title: "Decimal", items: ["1", "2", "3"] },
            { type: "upper-alpha", title: "Upper alpha", items: ["A", "B", "C"] },
            { type: "lower-alpha", title: "Lower alpha", items: ["a", "b", "c"] },
            {
                type: "upper-roman",
                title: "Upper Roman",
                items: ["I", "II", "III"],
            },
            {
                type: "lower-roman",
                title: "Lower Roman",
                items: ["i", "ii", "iii"],
            },
            { type: "lower-greek", title: "Lower Greek", items: ["α", "β", "γ"] },
        ] })));
}
export function BulletList(props) {
    const { editor } = props;
    const onClick = useCallback(() => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().toggleBulletList().run(); }, []);
    return (_jsx(ListTool, Object.assign({}, props, { type: "bulletList", onClick: onClick, isActive: editor.isActive("bulletList"), subTypes: [
            { type: "disc", title: "Decimal", items: ["1", "2", "3"] },
            { type: "circle", title: "Upper alpha", items: ["A", "B", "C"] },
            { type: "square", title: "Lower alpha", items: ["a", "b", "c"] },
        ] })));
}
export function Indent(props) {
    const { editor } = props, toolProps = __rest(props, ["editor"]);
    const isBottom = useToolbarLocation() === "bottom";
    const listItemType = findListItemType(editor);
    if (!listItemType || !isBottom)
        return null;
    return (_jsx(ToolButton, Object.assign({}, toolProps, { toggled: false, onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().sinkListItem(listItemType).run(); } })));
}
export function Outdent(props) {
    const { editor } = props, toolProps = __rest(props, ["editor"]);
    const isBottom = useToolbarLocation() === "bottom";
    const listItemType = findListItemType(editor);
    if (!listItemType || !isBottom)
        return null;
    return (_jsx(ToolButton, Object.assign({}, toolProps, { toggled: false, onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().liftListItem(listItemType).run(); } })));
}
function ListThumbnail(props) {
    const { listStyleType } = props;
    return (_jsx(Flex, Object.assign({ as: "ul", sx: {
            flexDirection: "column",
            flex: 1,
            p: 0,
            listStyleType,
        }, onMouseDown: (e) => e.preventDefault() }, { children: [0, 1, 2].map((i) => (_jsx(Box, Object.assign({ as: "li", sx: {
                display: "list-item",
                color: "text",
                fontSize: 8,
                mb: "1px",
            } }, { children: _jsx(Flex, Object.assign({ sx: {
                    alignItems: "center",
                } }, { children: _jsx(Box, { sx: {
                        width: "100%",
                        flexShrink: 0,
                        height: 4,
                        bg: "#cbcbcb",
                        borderRadius: "small",
                    } }) })) }), i.toString()))) })));
}
