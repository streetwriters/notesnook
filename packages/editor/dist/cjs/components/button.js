"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Button = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_2 = require("react");
const rebass_1 = require("rebass");
exports.Button = (0, react_1.forwardRef)((props, forwardedRef) => {
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
    return ((0, jsx_runtime_1.jsx)(rebass_1.Button, Object.assign({}, props, { ref: (ref) => {
            buttonRef.current = ref;
            if (typeof forwardedRef === "function")
                forwardedRef(ref);
            else if (forwardedRef)
                forwardedRef.current = ref;
        }, onClick: props.onClick, onMouseDown: () => { } })));
});
