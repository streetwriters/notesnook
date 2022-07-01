"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useRefValue = void 0;
const react_1 = require("react");
function useRefValue(value) {
    const refValue = (0, react_1.useRef)(value);
    (0, react_1.useEffect)(() => {
        refValue.current = value;
    }, [value]);
    return refValue;
}
exports.useRefValue = useRefValue;
