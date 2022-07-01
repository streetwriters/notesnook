"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageProperties = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const rebass_1 = require("rebass");
const react_1 = require("react");
const popup_1 = require("../components/popup");
const forms_1 = require("@rebass/forms");
const inlineinput_1 = require("../../components/inlineinput");
function ImageProperties(props) {
    const { height, width, float, editor, onClose } = props;
    const onSizeChange = (0, react_1.useCallback)((newWidth, newHeight) => {
        const size = newWidth
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
    return ((0, jsx_runtime_1.jsx)(popup_1.Popup, Object.assign({ title: "Image properties", onClose: onClose }, { children: (0, jsx_runtime_1.jsxs)(rebass_1.Flex, Object.assign({ sx: { width: ["auto", 300], flexDirection: "column", p: 1 } }, { children: [(0, jsx_runtime_1.jsxs)(rebass_1.Flex, Object.assign({ sx: { justifyContent: "space-between", alignItems: "center" } }, { children: [(0, jsx_runtime_1.jsx)(rebass_1.Text, Object.assign({ variant: "body" }, { children: "Floating?" })), (0, jsx_runtime_1.jsx)(forms_1.Checkbox, { checked: float, onClick: () => editor
                                .chain()
                                .setImageAlignment({ float: !float, align: "left" })
                                .run() })] })), (0, jsx_runtime_1.jsxs)(rebass_1.Flex, Object.assign({ sx: { alignItems: "center", mt: 2 } }, { children: [(0, jsx_runtime_1.jsx)(inlineinput_1.InlineInput, { label: "width", type: "number", value: width, containerProps: {
                                sx: { mr: 1 },
                            }, onChange: (e) => onSizeChange(e.target.valueAsNumber) }), (0, jsx_runtime_1.jsx)(inlineinput_1.InlineInput, { label: "height", type: "number", value: height, onChange: (e) => onSizeChange(undefined, e.target.valueAsNumber) })] }))] })) })));
}
exports.ImageProperties = ImageProperties;
