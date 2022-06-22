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
import { jsx as _jsx } from "react/jsx-runtime";
import { forwardRef, useCallback, useRef } from "react";
import { useEffect } from "react";
import { Button as RebassButton } from "rebass";
export var Button = forwardRef(function (props, forwardedRef) {
    var buttonRef = useRef();
    useEffect(function () {
        if (!buttonRef.current)
            return;
        buttonRef.current.addEventListener("mousedown", onMouseDown, {
            passive: false,
            capture: true,
        });
        return function () {
            var _a;
            (_a = buttonRef.current) === null || _a === void 0 ? void 0 : _a.removeEventListener("mousedown", onMouseDown, {
                capture: true,
            });
        };
    }, []);
    var onMouseDown = useCallback(function (e) {
        e.preventDefault();
    }, []);
    return (_jsx(RebassButton, __assign({}, props, { ref: function (ref) {
            buttonRef.current = ref;
            if (typeof forwardedRef === "function")
                forwardedRef(ref);
            else if (forwardedRef)
                forwardedRef.current = ref;
        }, onClick: props.onClick, onMouseDown: function () { } })));
});
