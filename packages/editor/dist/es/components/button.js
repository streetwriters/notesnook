import { jsx as _jsx } from "react/jsx-runtime";
import { forwardRef, useCallback, useRef } from "react";
import { useEffect } from "react";
import { Button as RebassButton } from "rebass";
export const Button = forwardRef((props, forwardedRef) => {
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
    return (_jsx(RebassButton, Object.assign({}, props, { ref: (ref) => {
            buttonRef.current = ref;
            if (typeof forwardedRef === "function")
                forwardedRef(ref);
            else if (forwardedRef)
                forwardedRef.current = ref;
        }, onClick: props.onClick, onMouseDown: () => { } })));
});
