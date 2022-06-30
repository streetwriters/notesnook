"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageProperties = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var rebass_1 = require("rebass");
var react_1 = require("react");
var popup_1 = require("../components/popup");
var forms_1 = require("@rebass/forms");
var inlineinput_1 = require("../../components/inlineinput");
function ImageProperties(props) {
    var height = props.height, width = props.width, float = props.float, editor = props.editor, onClose = props.onClose;
    var onSizeChange = (0, react_1.useCallback)(function (newWidth, newHeight) {
        var size = newWidth
            ? {
                width: newWidth,
                height: newWidth * (height / width),
            }
            : newHeight
                ? {
                    width: newHeight * (width / height),
                    height: newHeight,
                }
                : {
                    width: 0,
                    height: 0,
                };
        editor.chain().setImageSize(size).run();
    }, [width, height]);
    return ((0, jsx_runtime_1.jsx)(popup_1.Popup, __assign({ title: "Image properties", onClose: onClose }, { children: (0, jsx_runtime_1.jsxs)(rebass_1.Flex, __assign({ sx: { width: ["auto", 300], flexDirection: "column", p: 1 } }, { children: [(0, jsx_runtime_1.jsxs)(rebass_1.Flex, __assign({ sx: { justifyContent: "space-between", alignItems: "center" } }, { children: [(0, jsx_runtime_1.jsx)(rebass_1.Text, __assign({ variant: "body" }, { children: "Floating?" })), (0, jsx_runtime_1.jsx)(forms_1.Checkbox, { checked: float, onClick: function () {
                                return editor
                                    .chain()
                                    .setImageAlignment({ float: !float, align: "left" })
                                    .run();
                            } })] })), (0, jsx_runtime_1.jsxs)(rebass_1.Flex, __assign({ sx: { alignItems: "center", mt: 2 } }, { children: [(0, jsx_runtime_1.jsx)(inlineinput_1.InlineInput, { label: "width", type: "number", value: width, containerProps: {
                                sx: { mr: 1 },
                            }, onChange: function (e) { return onSizeChange(e.target.valueAsNumber); } }), (0, jsx_runtime_1.jsx)(inlineinput_1.InlineInput, { label: "height", type: "number", value: height, onChange: function (e) { return onSizeChange(undefined, e.target.valueAsNumber); } })] }))] })) })));
}
exports.ImageProperties = ImageProperties;
