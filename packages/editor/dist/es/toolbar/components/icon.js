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
import { jsx as _jsx } from "react/jsx-runtime";
import MDIIcon from "@mdi/react";
import { useTheme } from "emotion-theming";
import { Flex } from "rebass";
function MDIIconWrapper({ title, path, size = 24, color = "icon", stroke, rotate, }) {
    const theme = useTheme();
    const themedColor = theme.colors
        ? theme.colors[color]
        : color;
    return (_jsx(MDIIcon, { className: "icon", title: title, path: path, size: typeof size === "string" ? `${theme.iconSizes[size]}px` : `${size}px`, style: {
            strokeWidth: stroke || "0px",
            stroke: themedColor,
        }, color: themedColor, spin: rotate }));
}
export function Icon(props) {
    const { sx, title, color, size, stroke, rotate, path } = props, restProps = __rest(props, ["sx", "title", "color", "size", "stroke", "rotate", "path"]);
    return (_jsx(Flex, Object.assign({ sx: Object.assign({ flexShrink: 0, justifyContent: "center", alignItems: "center" }, sx) }, restProps, { children: _jsx(MDIIconWrapper, { title: title, path: path, rotate: rotate, color: color, stroke: stroke, size: size }) })));
}
