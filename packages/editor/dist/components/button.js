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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Button = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var react_2 = require("react");
var rebass_1 = require("rebass");
exports.Button = (0, react_1.forwardRef)(function (props, forwardedRef) {
    var buttonRef = (0, react_1.useRef)();
    (0, react_2.useEffect)(function () {
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
    var onMouseDown = (0, react_1.useCallback)(function (e) {
        e.preventDefault();
    }, []);
    return ((0, jsx_runtime_1.jsx)(rebass_1.Button, __assign({}, props, { ref: function (ref) {
            buttonRef.current = ref;
            if (typeof forwardedRef === "function")
                forwardedRef(ref);
            else if (forwardedRef)
                forwardedRef.current = ref;
        }, onClick: props.onClick, onMouseDown: function () { } })));
});
