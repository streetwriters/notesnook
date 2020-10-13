import {eSendEvent} from "../services/EventManager";
import {eThemeUpdated} from "./Events";

export const ACCENT = {
    color: '#0560FF',
    shade: '#0560FF12',
};
const fixedColors = {
    accent: ACCENT.color,
    shade: ACCENT.shade,
    fg: ACCENT.color,
    normal: 'black',
    icon: 'gray',
    errorBg: '#FFD2D2',
    errorText: '#ff6961',
    successBg: '#DFF2BF',
    successText: '#4F8A10',
    warningBg: '#FEEFB3',
    warningText: '#9F6000',
};
export var COLOR_SCHEME = {
    night: false,
    bg: 'white',
    navbg: '#f6fbfc',
    nav: '#f0f0f0',
    pri: '#000000',
    sec: 'white',
    ...fixedColors,
};

export const COLOR_SCHEME_LIGHT = {
    night: false,
    bg: 'white',
    navbg: '#f6fbfc',
    nav: '#f0f0f0',
    input: 'transparent',
    heading: '#000000',
    pri: '#24292e',
    sec: 'white',
    ...fixedColors,
};
export const COLOR_SCHEME_DARK = {
    night: true,
    bg: '#1f1f1f',
    navbg: '#1c1c1c',
    input: '#2d2d2d',
    nav: '#2d2d2d',
    heading: '#ffffff',
    pri: '#D3D3D3',
    sec: 'black',
    ...fixedColors,
};
export const COLORS_NOTE = {
    red: '#f44336',
    orange: '#FF9800',
    yellow: '#FFD600',
    green: '#4CAF50',
    blue: '#2196F3',
    purple: '#673AB7',
    gray: '#9E9E9E',
};

export function setColorScheme(colors = COLOR_SCHEME, accent = ACCENT) {
    COLOR_SCHEME = {...colors, accent: accent.color, shade: accent.shade};

    eSendEvent(eThemeUpdated);

    return COLOR_SCHEME;
}

export function setAccentColor(color) {
    ACCENT.color = color;
    ACCENT.shade = color + '12';

    return ACCENT;
}