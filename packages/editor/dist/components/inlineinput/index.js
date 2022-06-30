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
Object.defineProperty(exports, "__esModule", { value: true });
exports.InlineInput = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var forms_1 = require("@rebass/forms");
var rebass_1 = require("rebass");
function InlineInput(props) {
    var label = props.label, containerProps = props.containerProps, sx = props.sx, inputProps = __rest(props, ["label", "containerProps", "sx"]);
    return ((0, jsx_runtime_1.jsxs)(rebass_1.Flex, __assign({}, containerProps, { sx: __assign(__assign({ flex: 1 }, containerProps === null || containerProps === void 0 ? void 0 : containerProps.sx), { outline: "1px solid var(--border)", p: 2, borderRadius: "default", ":focus-within": {
                outlineColor: "primary",
                outlineWidth: "1.8px",
            } }) }, { children: [(0, jsx_runtime_1.jsx)(forms_1.Input, __assign({ variant: "clean", sx: __assign(__assign({}, sx), { p: 0 }) }, inputProps)), (0, jsx_runtime_1.jsx)(rebass_1.Text, __assign({ variant: "body", sx: {
                    flexShrink: 0,
                    color: "fontTertiary",
                    borderLeft: "1px solid var(--border)",
                    pl: 1,
                } }, { children: label }))] })));
}
exports.InlineInput = InlineInput;
