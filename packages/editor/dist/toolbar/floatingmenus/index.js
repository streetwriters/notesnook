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
import { TableRowFloatingMenu, TableColumnFloatingMenu } from "./table";
export function EditorFloatingMenus(props) {
    return (_jsxs(_Fragment, { children: [_jsx(TableRowFloatingMenu, __assign({}, props)), _jsx(TableColumnFloatingMenu, __assign({}, props))] }));
}
