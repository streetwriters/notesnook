"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useRefValue = void 0;
var react_1 = require("react");
function useRefValue(value) {
    var refValue = (0, react_1.useRef)(value);
    (0, react_1.useEffect)(function () {
        refValue.current = value;
    }, [value]);
    return refValue;
}
exports.useRefValue = useRefValue;
