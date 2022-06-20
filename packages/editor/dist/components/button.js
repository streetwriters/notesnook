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
import { useCallback, useRef } from "react";
import { useEffect } from "react";
import { Button as RebassButton } from "rebass";
export function Button(props) {
    var buttonRef = useRef();
    var touchStartTime = useRef(0);
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
    }, [buttonRef.current]);
    var onMouseDown = useCallback(function (e) {
        console.log("Preventing");
        e.preventDefault();
    }, []);
    // const onTouchEnd = useCallback((e) => {
    //   e.preventDefault();
    //   const now = Date.now();
    //   setTimeout(() => {
    //     if (touchStartTime.current === 0) return;
    //     if (now - touchStartTime.current > 300) return;
    //     //@ts-ignore
    //     props.onClick(e);
    //   }, 1);
    // }, []);
    // const onTouchStart = useCallback((e) => {
    //   touchStartTime.current = Date.now();
    //   e.preventDefault();
    // }, []);
    return (_jsx(RebassButton, __assign({}, props, { ref: function (ref) {
            buttonRef.current = ref;
            // props.ref = ref;
        }, onClick: props.onClick, onMouseDown: function () { } })));
}
