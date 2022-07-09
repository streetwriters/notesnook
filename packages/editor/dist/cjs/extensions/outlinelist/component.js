"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutlineListComponent = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const rebass_1 = require("rebass");
const react_1 = require("react");
const outlinelistitem_1 = require("../outlinelistitem");
function OutlineListComponent(props) {
    const { editor, getPos, node, updateAttributes, forwardRef } = props;
    const { collapsed } = node.attrs;
    const isNested = (0, react_1.useMemo)(() => {
        var _a;
        const pos = editor.state.doc.resolve(getPos());
        return ((_a = pos.parent) === null || _a === void 0 ? void 0 : _a.type.name) === outlinelistitem_1.OutlineListItem.name;
    }, []);
    return ((0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: (0, jsx_runtime_1.jsx)(rebass_1.Text, { className: "outline-list", as: "div", ref: forwardRef, sx: {
                ul: {
                    display: collapsed ? "none" : "block",
                    paddingInlineStart: 0,
                    paddingLeft: 0,
                    marginBlockStart: isNested ? 5 : 0,
                    marginBlockEnd: 0
                },
                li: {
                    listStyleType: "none"
                }
            } }) }));
}
exports.OutlineListComponent = OutlineListComponent;
