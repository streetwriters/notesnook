"use strict";
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
exports.Outdent = exports.Indent = exports.BulletList = exports.NumberedList = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const rebass_1 = require("rebass");
const react_1 = require("react");
const splitbutton_1 = require("../components/splitbutton");
const toolbarstore_1 = require("../stores/toolbarstore");
const dom_1 = require("../utils/dom");
const popuppresenter_1 = require("../../components/popuppresenter");
const react_2 = __importDefault(require("react"));
const toolbutton_1 = require("../components/toolbutton");
const prosemirror_1 = require("../utils/prosemirror");
function _ListTool(props) {
    const { editor, onClick, isActive, subTypes, type } = props, toolProps = __rest(props, ["editor", "onClick", "isActive", "subTypes", "type"]);
    const toolbarLocation = (0, toolbarstore_1.useToolbarLocation)();
    const isBottom = toolbarLocation === "bottom";
    const [isOpen, setIsOpen] = (0, react_1.useState)(false);
    const buttonRef = (0, react_1.useRef)();
    return ((0, jsx_runtime_1.jsx)(splitbutton_1.SplitButton, Object.assign({}, toolProps, { buttonRef: buttonRef, onClick: onClick, toggled: isOpen, sx: { mr: 0 }, onOpen: () => setIsOpen((s) => !s) }, { children: (0, jsx_runtime_1.jsx)(popuppresenter_1.PopupWrapper, { isOpen: isOpen, group: "lists", id: toolProps.title, blocking: false, focusOnRender: false, position: {
                isTargetAbsolute: true,
                target: isBottom ? (0, dom_1.getToolbarElement)() : buttonRef.current || "mouse",
                align: "center",
                location: isBottom ? "top" : "below",
                yOffset: isBottom ? 10 : 5,
            }, onClosed: () => setIsOpen(false), renderPopup: () => ((0, jsx_runtime_1.jsx)(rebass_1.Box, Object.assign({ sx: {
                    bg: "background",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    p: 1,
                } }, { children: subTypes.map((item) => ((0, jsx_runtime_1.jsx)(rebass_1.Button, Object.assign({ variant: "menuitem", sx: { width: 80 }, onClick: () => {
                        var _a;
                        let chain = (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus();
                        if (!chain || !editor.current)
                            return;
                        if (!(0, prosemirror_1.isListActive)(editor.current)) {
                            if (type === "bulletList")
                                chain = chain.toggleBulletList();
                            else
                                chain = chain.toggleOrderedList();
                        }
                        return chain
                            .updateAttributes(type, { listType: item.type })
                            .run();
                    } }, { children: (0, jsx_runtime_1.jsx)(ListThumbnail, { listStyleType: item.type }) }), item.title))) }))) }) })));
}
const ListTool = react_2.default.memo(_ListTool, (prev, next) => {
    return prev.isActive === next.isActive;
});
function NumberedList(props) {
    const { editor } = props;
    const onClick = (0, react_1.useCallback)(() => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().toggleOrderedList().run(); }, []);
    return ((0, jsx_runtime_1.jsx)(ListTool, Object.assign({}, props, { type: "orderedList", isActive: editor.isActive("orderedList"), onClick: onClick, subTypes: [
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
exports.NumberedList = NumberedList;
function BulletList(props) {
    const { editor } = props;
    const onClick = (0, react_1.useCallback)(() => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().toggleBulletList().run(); }, []);
    return ((0, jsx_runtime_1.jsx)(ListTool, Object.assign({}, props, { type: "bulletList", onClick: onClick, isActive: editor.isActive("bulletList"), subTypes: [
            { type: "disc", title: "Decimal", items: ["1", "2", "3"] },
            { type: "circle", title: "Upper alpha", items: ["A", "B", "C"] },
            { type: "square", title: "Lower alpha", items: ["a", "b", "c"] },
        ] })));
}
exports.BulletList = BulletList;
function Indent(props) {
    const { editor } = props, toolProps = __rest(props, ["editor"]);
    const isBottom = (0, toolbarstore_1.useToolbarLocation)() === "bottom";
    const listItemType = (0, prosemirror_1.findListItemType)(editor);
    if (!listItemType || !isBottom)
        return null;
    return ((0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, Object.assign({}, toolProps, { toggled: false, onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().sinkListItem(listItemType).run(); } })));
}
exports.Indent = Indent;
function Outdent(props) {
    const { editor } = props, toolProps = __rest(props, ["editor"]);
    const isBottom = (0, toolbarstore_1.useToolbarLocation)() === "bottom";
    const listItemType = (0, prosemirror_1.findListItemType)(editor);
    if (!listItemType || !isBottom)
        return null;
    return ((0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, Object.assign({}, toolProps, { toggled: false, onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().liftListItem(listItemType).run(); } })));
}
exports.Outdent = Outdent;
function ListThumbnail(props) {
    const { listStyleType } = props;
    return ((0, jsx_runtime_1.jsx)(rebass_1.Flex, Object.assign({ as: "ul", sx: {
            flexDirection: "column",
            flex: 1,
            p: 0,
            listStyleType,
        }, onMouseDown: (e) => e.preventDefault() }, { children: [0, 1, 2].map((i) => ((0, jsx_runtime_1.jsx)(rebass_1.Box, Object.assign({ as: "li", sx: {
                display: "list-item",
                color: "text",
                fontSize: 8,
                mb: "1px",
            } }, { children: (0, jsx_runtime_1.jsx)(rebass_1.Flex, Object.assign({ sx: {
                    alignItems: "center",
                } }, { children: (0, jsx_runtime_1.jsx)(rebass_1.Box, { sx: {
                        width: "100%",
                        flexShrink: 0,
                        height: 4,
                        bg: "#cbcbcb",
                        borderRadius: "small",
                    } }) })) }), i.toString()))) })));
}
