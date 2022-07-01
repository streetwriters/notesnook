import { jsx as _jsx } from "react/jsx-runtime";
import { Box } from "rebass";
export function MenuSeparator() {
    return (_jsx(Box, { as: "li", sx: {
            width: "95%",
            height: "0.5px",
            bg: "border",
            my: 2,
            alignSelf: "center",
        } }));
}
