"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuSeparator = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var rebass_1 = require("rebass");
function MenuSeparator() {
    return ((0, jsx_runtime_1.jsx)(rebass_1.Box, { as: "li", sx: {
            width: "95%",
            height: "0.5px",
            bg: "border",
            my: 2,
            alignSelf: "center",
        } }));
}
exports.MenuSeparator = MenuSeparator;
