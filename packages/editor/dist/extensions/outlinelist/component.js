import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Text } from "rebass";
import { useMemo } from "react";
import { OutlineListItem } from "../outline-list-item";
export function OutlineListComponent(props) {
    var editor = props.editor, getPos = props.getPos, node = props.node, updateAttributes = props.updateAttributes, forwardRef = props.forwardRef;
    var collapsed = node.attrs.collapsed;
    var isNested = useMemo(function () {
        var _a;
        var pos = editor.state.doc.resolve(getPos());
        return ((_a = pos.parent) === null || _a === void 0 ? void 0 : _a.type.name) === OutlineListItem.name;
    }, []);
    return (_jsx(_Fragment, { children: _jsx(Text, { className: "outline-list", as: "div", ref: forwardRef, sx: {
                ul: {
                    display: collapsed ? "none" : "block",
                    paddingInlineStart: 0,
                    paddingLeft: isNested ? 1 : 0,
                    marginBlockStart: isNested ? 5 : 0,
                    marginBlockEnd: 0,
                },
            } }) }));
}
