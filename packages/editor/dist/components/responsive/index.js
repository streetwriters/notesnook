import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import { useToolbarStore } from "../../toolbar/stores/toolbar-store";
export function ResponsiveContainer(props) {
    var isMobile = useToolbarStore(function (store) { return store.isMobile; });
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
