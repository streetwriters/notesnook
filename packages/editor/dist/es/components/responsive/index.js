var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import { useIsMobile, } from "../../toolbar/stores/toolbar-store";
import { ActionSheetPresenter, } from "../action-sheet";
import { MenuPresenter } from "../menu";
export function ResponsiveContainer(props) {
    const isMobile = useIsMobile();
    if (isMobile)
        return props.mobile || null;
    else
        return props.desktop || null;
}
export function DesktopOnly(props) {
    return _jsx(ResponsiveContainer, { desktop: _jsx(_Fragment, { children: props.children }) });
}
export function MobileOnly(props) {
    return _jsx(ResponsiveContainer, { mobile: _jsx(_Fragment, { children: props.children }) });
}
export function ResponsivePresenter(props) {
    const { mobile = "menu", desktop = "menu" } = props, restProps = __rest(props, ["mobile", "desktop"]);
    const isMobile = useIsMobile();
    if (isMobile && mobile === "sheet")
        return _jsx(ActionSheetPresenter, Object.assign({}, restProps));
    else if (mobile === "menu" || desktop === "menu")
        return _jsx(MenuPresenter, Object.assign({}, restProps));
    else
        return props.isOpen ? _jsx(_Fragment, { children: props.children }) : null;
}
