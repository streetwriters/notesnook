"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThemeProvider = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const emotion_theming_1 = require("emotion-theming");
const toolbarstore_1 = require("../../toolbar/stores/toolbarstore");
function ThemeProvider(props) {
    const theme = (0, toolbarstore_1.useTheme)();
    return ((0, jsx_runtime_1.jsx)(emotion_theming_1.ThemeProvider, Object.assign({ theme: theme || {} }, { children: props.children })));
}
exports.ThemeProvider = ThemeProvider;
