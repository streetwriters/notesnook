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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Input } from "@rebass/forms";
import { Flex, Text } from "rebass";
export function InlineInput(props) {
    const { label, containerProps, sx } = props, inputProps = __rest(props, ["label", "containerProps", "sx"]);
    return (_jsxs(Flex, Object.assign({}, containerProps, { sx: Object.assign(Object.assign({ flex: 1 }, containerProps === null || containerProps === void 0 ? void 0 : containerProps.sx), { outline: "1px solid var(--border)", p: 2, borderRadius: "default", ":focus-within": {
                outlineColor: "primary",
                outlineWidth: "1.8px",
            } }) }, { children: [_jsx(Input, Object.assign({ variant: "clean", sx: Object.assign(Object.assign({}, sx), { p: 0 }) }, inputProps)), _jsx(Text, Object.assign({ variant: "body", sx: {
                    flexShrink: 0,
                    color: "fontTertiary",
                    borderLeft: "1px solid var(--border)",
                    pl: 1,
                } }, { children: label }))] })));
}
