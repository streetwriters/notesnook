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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { TableRowFloatingMenu, TableColumnFloatingMenu, TableFloatingMenu, } from "./table/table";
import { SearchReplaceFloatingMenu } from "./search-replace";
import { DesktopOnly, MobileOnly } from "../../components/responsive";
export function EditorFloatingMenus(props) {
    return (_jsxs(_Fragment, { children: [_jsxs(DesktopOnly, { children: [_jsx(TableRowFloatingMenu, __assign({}, props)), _jsx(TableColumnFloatingMenu, __assign({}, props))] }), _jsx(MobileOnly, { children: _jsx(TableFloatingMenu, __assign({}, props)) }), _jsx(SearchReplaceFloatingMenu, __assign({}, props))] }));
}
