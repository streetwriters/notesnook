"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutlineListComponent = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var rebass_1 = require("rebass");
var react_1 = require("react");
var outlinelistitem_1 = require("../outlinelistitem");
function OutlineListComponent(props) {
    var editor = props.editor, getPos = props.getPos, node = props.node, updateAttributes = props.updateAttributes, forwardRef = props.forwardRef;
    var collapsed = node.attrs.collapsed;
    var isNested = (0, react_1.useMemo)(function () {
        var _a;
        var pos = editor.state.doc.resolve(getPos());
        return ((_a = pos.parent) === null || _a === void 0 ? void 0 : _a.type.name) === outlinelistitem_1.OutlineListItem.name;
    }, []);
    return ((0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: (0, jsx_runtime_1.jsx)(rebass_1.Text, { className: "outline-list", as: "div", ref: forwardRef, sx: {
                ul: {
                    display: collapsed ? "none" : "block",
                    paddingInlineStart: 0,
                    paddingLeft: isNested ? 1 : 0,
                    marginBlockStart: isNested ? 5 : 0,
                    marginBlockEnd: 0,
                },
            } }) }));
}
exports.OutlineListComponent = OutlineListComponent;
