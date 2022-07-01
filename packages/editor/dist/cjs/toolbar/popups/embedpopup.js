"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbedPopup = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const rebass_1 = require("rebass");
const react_1 = require("react");
const popup_1 = require("../components/popup");
const forms_1 = require("@rebass/forms");
const lib_1 = require("@social-embed/lib");
const inlineinput_1 = require("../../components/inlineinput");
const tabs_1 = require("../../components/tabs");
function EmbedPopup(props) {
    const { onClose, onSizeChanged, onSourceChanged, title, embed } = props;
    const [width, setWidth] = (0, react_1.useState)((embed === null || embed === void 0 ? void 0 : embed.width) || 300);
    const [height, setHeight] = (0, react_1.useState)((embed === null || embed === void 0 ? void 0 : embed.height) || 150);
    const [src, setSrc] = (0, react_1.useState)((embed === null || embed === void 0 ? void 0 : embed.src) || "");
    const [embedSource, setEmbedSource] = (0, react_1.useState)("url");
    const [error, setError] = (0, react_1.useState)(null);
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
        setWidth(size.width);
        setHeight(size.height);
        if (onSizeChanged)
            onSizeChanged(size);
    }, [width, height]);
    (0, react_1.useEffect)(() => {
        onSourceChanged && onSourceChanged(src);
    }, [onSourceChanged, src]);
    return ((0, jsx_runtime_1.jsx)(popup_1.Popup, Object.assign({ title: title, onClose: () => onClose(), action: {
            title,
            onClick: () => {
                setError(null);
                let _src = src;
                let _width = width;
                let _height = height;
                if (embedSource === "code") {
                    const document = new DOMParser().parseFromString(src, "text/html");
                    if (document.getElementsByTagName("iframe").length <= 0)
                        return setError("Embed code must include an iframe.");
                    const srcValue = getAttribute(document, "src");
                    if (!srcValue)
                        return setError("Embed code must include an iframe with an src attribute.");
                    _src = srcValue;
                    const widthValue = getAttribute(document, "width");
                    if (widthValue && !isNaN(parseInt(widthValue)))
                        _width = parseInt(widthValue);
                    const heightValue = getAttribute(document, "height");
                    if (heightValue && !isNaN(parseInt(heightValue)))
                        _height = parseInt(heightValue);
                }
                const convertedUrl = (0, lib_1.convertUrlToEmbedUrl)(_src);
                if (!!convertedUrl)
                    _src = convertedUrl;
                onClose({
                    height: _height,
                    width: _width,
                    src: _src,
                });
            },
        } }, { children: (0, jsx_runtime_1.jsxs)(rebass_1.Flex, Object.assign({ sx: { flexDirection: "column", width: ["auto", 300] } }, { children: [error && ((0, jsx_runtime_1.jsxs)(rebass_1.Text, Object.assign({ variant: "error", sx: {
                        bg: "errorBg",
                        color: "error",
                        p: 1,
                        borderRadius: "default",
                    } }, { children: ["Error: ", error] }))), (0, jsx_runtime_1.jsxs)(tabs_1.Tabs, Object.assign({ activeIndex: 0, containerProps: { sx: { mx: 1, flexDirection: "column" } }, onTabChanged: (index) => setEmbedSource(index === 0 ? "url" : "code") }, { children: [(0, jsx_runtime_1.jsxs)(tabs_1.Tab, Object.assign({ title: "From URL" }, { children: [(0, jsx_runtime_1.jsx)(forms_1.Input, { placeholder: "Enter embed source URL", value: src, autoFocus: true, onChange: (e) => setSrc(e.target.value), autoCapitalize: "none", sx: { fontSize: "body" } }), (0, jsx_runtime_1.jsxs)(rebass_1.Flex, Object.assign({ sx: { alignItems: "center", mt: 1 } }, { children: [(0, jsx_runtime_1.jsx)(inlineinput_1.InlineInput, { containerProps: { sx: { mr: 1 } }, label: "width", type: "number", placeholder: "Width", value: width, sx: {
                                                mr: 1,
                                                fontSize: "body",
                                            }, onChange: (e) => onSizeChange(e.target.valueAsNumber) }), (0, jsx_runtime_1.jsx)(inlineinput_1.InlineInput, { label: "height", type: "number", placeholder: "Height", value: height, sx: { fontSize: "body" }, onChange: (e) => onSizeChange(undefined, e.target.valueAsNumber) })] }))] })), (0, jsx_runtime_1.jsx)(tabs_1.Tab, Object.assign({ title: "From code" }, { children: (0, jsx_runtime_1.jsx)(forms_1.Textarea, { autoFocus: true, variant: "forms.input", sx: { fontSize: "subBody", fontFamily: "monospace" }, minHeight: [200, 100], onChange: (e) => setSrc(e.target.value), placeholder: "Paste embed code here. Only iframes are supported." }) }))] }))] })) })));
}
exports.EmbedPopup = EmbedPopup;
function getAttribute(document, id) {
    const element = document.querySelector(`[${id}]`);
    if (!element)
        return null;
    const attribute = element.getAttribute(id);
    return attribute;
}
