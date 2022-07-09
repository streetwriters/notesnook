"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Resizer = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const re_resizable_1 = require("re-resizable");
const toolbar_1 = require("../../toolbar");
function Resizer(props) {
    const { editor, selected, onResize, width, height, children } = props;
    return ((0, jsx_runtime_1.jsx)(re_resizable_1.Resizable, Object.assign({ enable: {
            bottom: false,
            left: false,
            right: false,
            top: false,
            bottomLeft: false,
            bottomRight: editor.isEditable && selected,
            topLeft: false,
            topRight: false,
        }, size: {
            height: height || "auto",
            width: width || "auto",
        }, maxWidth: "100%", minWidth: 150, minHeight: 150, handleComponent: {
            bottomRight: ((0, jsx_runtime_1.jsx)(toolbar_1.Icon, { sx: {
                    width: 25,
                    height: 25,
                    marginLeft: -17,
                    marginTop: "3px",
                    borderTopLeftRadius: "default",
                    borderBottomRightRadius: "default",
                }, path: toolbar_1.Icons.resize, size: 25, color: "primary" })),
        }, onResizeStop: (e, direction, ref, d) => {
            try {
                onResize(ref.clientWidth, ref.clientHeight);
            }
            catch (_a) {
                // ignore
            }
        }, lockAspectRatio: true }, { children: children })));
}
exports.Resizer = Resizer;
