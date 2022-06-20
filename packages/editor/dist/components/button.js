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
import { Button as RebassButton } from "rebass";
export default function Button(props) {
    var touchStartTime = useRef(0);
    var onTouchEnd = useCallback(function (e) {
        e.preventDefault();
        var now = Date.now();
        setTimeout(function () {
            if (touchStartTime.current === 0)
                return;
            if (now - touchStartTime.current > 300)
                return;
            //@ts-ignore
            props.onClick(e);
        }, 1);
    }, []);
    var onTouchStart = useCallback(function (e) {
        touchStartTime.current = Date.now();
        e.preventDefault();
    }, []);
    return (_jsx(RebassButton, __assign({}, props, { onClick: props.onClick, onMouseDown: function (e) { return e.preventDefault(); }, onTouchEnd: onTouchEnd, onTouchMove: function () {
            touchStartTime.current = 0;
        }, onTouchStart: onTouchStart })));
}
