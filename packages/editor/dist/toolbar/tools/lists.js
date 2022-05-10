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
import { jsx as _jsx } from "react/jsx-runtime";
import { Box, Button, Flex } from "rebass";
import { SplitButton } from "../components/split-button";
function ListTool(props) {
    var editor = props.editor, options = props.options, toolProps = __rest(props, ["editor", "options"]);
    var isActive = editor.isActive(options.type);
    return (_jsx(SplitButton, __assign({}, toolProps, { onClick: function () { return options.onClick(editor); }, toggled: isActive, sx: { mr: 0 }, menuPresenterProps: {
            items: options.subTypes.map(function (item) { return ({
                key: item.type,
                tooltip: item.title,
                type: "menuitem",
                component: function (_a) {
                    var onClick = _a.onClick;
                    return (_jsx(Button, __assign({ variant: "menuitem", onClick: onClick }, { children: _jsx(ListThumbnail, { listStyleType: item.type }) })));
                },
                onClick: function () {
                    var chain = editor.chain().focus();
                    if (!isActive) {
                        if (options.type === "bulletList")
                            chain = chain.toggleBulletList();
                        else
                            chain = chain.toggleOrderedList();
                    }
                    return chain
                        .updateAttributes(options.type, { listType: item.type })
                        .run();
                },
            }); }),
            sx: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", p: 1 },
        } })));
}
export function NumberedList(props) {
    var options = {
        type: "orderedList",
        icon: "numberedList",
        onClick: function (editor) { return editor.chain().focus().toggleOrderedList().run(); },
        subTypes: [
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
        ],
    };
    return _jsx(ListTool, __assign({}, props, { options: options }));
}
export function BulletList(props) {
    var options = {
        type: "bulletList",
        icon: "bulletList",
        onClick: function (editor) { return editor.chain().focus().toggleOrderedList().run(); },
        subTypes: [
            { type: "disc", title: "Decimal", items: ["1", "2", "3"] },
            { type: "circle", title: "Upper alpha", items: ["A", "B", "C"] },
            { type: "square", title: "Lower alpha", items: ["a", "b", "c"] },
        ],
    };
    return _jsx(ListTool, __assign({}, props, { options: options }));
}
function ListThumbnail(props) {
    var listStyleType = props.listStyleType;
    return (_jsx(Flex, __assign({ as: "ul", sx: {
            flexDirection: "column",
            flex: 1,
            p: 0,
            listStyleType: listStyleType,
        } }, { children: [0, 0, 0].map(function () { return (_jsx(Box, __assign({ as: "li", sx: {
                display: "list-item",
                color: "text",
                fontSize: 8,
                mb: "1px",
            } }, { children: _jsx(Flex, __assign({ sx: {
                    alignItems: "center",
                } }, { children: _jsx(Box, { sx: {
                        width: "100%",
                        flexShrink: 0,
                        height: 4,
                        bg: "#cbcbcb",
                        borderRadius: "2px",
                    } }) })) }))); }) })));
}
