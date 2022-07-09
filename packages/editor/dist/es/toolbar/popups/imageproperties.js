import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Flex } from "rebass";
import { useCallback } from "react";
import { Popup } from "../components/popup";
import { Checkbox, Label } from "@rebass/forms";
import { InlineInput } from "../../components/inline-input";
import { DesktopOnly } from "../../components/responsive";
export function ImageProperties(props) {
    const { height, width, float, editor, onClose } = props;
    const onSizeChange = useCallback((newWidth, newHeight) => {
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
    return (_jsx(Popup, Object.assign({ title: "Image properties", onClose: onClose }, { children: _jsxs(Flex, Object.assign({ sx: { width: ["auto", 300], flexDirection: "column", p: 1 } }, { children: [_jsx(DesktopOnly, { children: _jsxs(Label, Object.assign({ variant: "text.body", sx: { justifyContent: "space-between", alignItems: "center" } }, { children: ["Float image", _jsx(Checkbox, { checked: float, onClick: () => editor
                                    .chain()
                                    .setImageAlignment({ float: !float, align: "left" })
                                    .run() })] })) }), _jsxs(Flex, Object.assign({ sx: { alignItems: "center", mt: 2 } }, { children: [_jsx(InlineInput, { label: "width", type: "number", value: width, containerProps: {
                                sx: { mr: 1 },
                            }, onChange: (e) => onSizeChange(e.target.valueAsNumber) }), _jsx(InlineInput, { label: "height", type: "number", value: height, onChange: (e) => onSizeChange(undefined, e.target.valueAsNumber) })] }))] })) })));
}
