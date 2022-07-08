"use strict";
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
exports.Button = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_2 = require("react");
const rebass_1 = require("rebass");
exports.Button = (0, react_1.forwardRef)((props, forwardedRef) => {
    var _a;
    const { sx } = props, buttonProps = __rest(props, ["sx"]);
    const hoverBg = ((_a = sx === null || sx === void 0 ? void 0 : sx[":hover"]) === null || _a === void 0 ? void 0 : _a["bg"]) || "hover";
    const bg = (sx === null || sx === void 0 ? void 0 : sx["bg"]) || "unset";
    const buttonRef = (0, react_1.useRef)();
    (0, react_2.useEffect)(() => {
        if (!buttonRef.current)
            return;
        buttonRef.current.addEventListener("mousedown", onMouseDown, {
            passive: false,
            capture: true,
        });
        return () => {
            var _a;
            (_a = buttonRef.current) === null || _a === void 0 ? void 0 : _a.removeEventListener("mousedown", onMouseDown, {
                capture: true,
            });
        };
    }, []);
    const onMouseDown = (0, react_1.useCallback)((e) => {
        e.preventDefault();
    }, []);
    return ((0, jsx_runtime_1.jsx)(rebass_1.Button, Object.assign({}, buttonProps, { sx: Object.assign(Object.assign({}, sx), { ":hover": { bg: [bg, hoverBg] }, ":active": { bg: hoverBg } }), ref: (ref) => {
            buttonRef.current = ref;
            if (typeof forwardedRef === "function")
                forwardedRef(ref);
            else if (forwardedRef)
                forwardedRef.current = ref;
        }, onClick: props.onClick })));
});
