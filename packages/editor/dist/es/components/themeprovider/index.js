import { jsx as _jsx } from "react/jsx-runtime";
import { ThemeProvider as EmotionThemeProvider } from "emotion-theming";
import { useTheme } from "../../toolbar/stores/toolbar-store";
export function ThemeProvider(props) {
    const theme = useTheme();
    return (_jsx(EmotionThemeProvider, Object.assign({ theme: theme || {} }, { children: props.children })));
}
