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
import { jsx as _jsx } from "react/jsx-runtime";
import { FloatingMenu } from "@tiptap/react";
import { Flex, Text } from "rebass";
export function TableRowFloatingMenu(props) {
    var editor = props.editor;
    return (_jsx(FloatingMenu, __assign({ editor: editor, shouldShow: function (_a) {
            var editor = _a.editor, state = _a.state;
            return editor.isActive("tableRow") && state.selection.empty;
        } }, { children: _jsx(Flex, __assign({ sx: { bg: "background" } }, { children: _jsx(Text, { children: "Hello" }) })) })));
}
