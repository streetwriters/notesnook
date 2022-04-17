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
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import ReactToggle from "react-toggle";
import "react-toggle/style.css";
var css = ".react-toggle {\n    display: flex;\n    align-items: center;\n  }\n  \n  .react-toggle-thumb {\n    box-shadow: none;\n  }\n  \n  .react-toggle-track {\n    width: 30px;\n    height: 18px;\n  }\n  \n  .react-toggle-thumb {\n    width: 16px;\n    height: 16px;\n    top: 0px;\n    left: 1px;\n    margin-top: 1px;\n  }\n  \n  .react-toggle--checked .react-toggle-thumb {\n    left: 13px;\n    border-color: var(--primary);\n  }\n  \n  .react-toggle:active:not(.react-toggle--disabled) .react-toggle-thumb {\n    box-shadow: none;\n  }\n  \n  .react-toggle--focus .react-toggle-thumb {\n    box-shadow: none;\n  }\n  ";
export function Toggle(props) {
    return (_jsxs(_Fragment, { children: [_jsx("style", { children: css }), _jsx(ReactToggle, __assign({ size: 20, onChange: function () { }, icons: false }, props))] }));
}
