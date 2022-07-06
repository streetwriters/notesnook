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
import { jsx as _jsx } from "react/jsx-runtime";
import { forwardRef, useCallback, useRef } from "react";
import { useEffect } from "react";
import { Button as RebassButton } from "rebass";
export const Button = forwardRef((props, forwardedRef) => {
    var _a;
    const { sx } = props, buttonProps = __rest(props, ["sx"]);
    const hoverBg = ((_a = sx === null || sx === void 0 ? void 0 : sx[":hover"]) === null || _a === void 0 ? void 0 : _a["bg"]) || "hover";
    const buttonRef = useRef();
    useEffect(() => {
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
    const onMouseDown = useCallback((e) => {
        e.preventDefault();
    }, []);
    return (_jsx(RebassButton, Object.assign({}, buttonProps, { sx: Object.assign(Object.assign({}, sx), { ":hover": { bg: ["transparent", hoverBg] }, ":active": { bg: hoverBg } }), ref: (ref) => {
            buttonRef.current = ref;
            if (typeof forwardedRef === "function")
                forwardedRef(ref);
            else if (forwardedRef)
                forwardedRef.current = ref;
        }, onClick: props.onClick, onMouseDown: () => { } })));
});
