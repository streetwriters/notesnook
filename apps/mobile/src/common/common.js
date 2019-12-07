import {DeviceEventEmitter} from 'react-native';
//COLOR SCHEME
export const ACCENT = {
  color: '#0560FF',
};
export function setColorScheme(colors = COLOR_SCHEME, accent = ACCENT.color) {
  COLOR_SCHEME.bg = colors.bg;
  COLOR_SCHEME.fg = accent;
  COLOR_SCHEME.navbg = colors.navbg;
  COLOR_SCHEME.nav = colors.nav;
  COLOR_SCHEME.pri = colors.pri;
  COLOR_SCHEME.sec = colors.sec;
  COLOR_SCHEME.accent = accent;
  COLOR_SCHEME.normal = colors.normal;
  COLOR_SCHEME.night = colors.night;
  COLOR_SCHEME.icon = colors.icon;

  DeviceEventEmitter.emit('onThemeUpdate');
}

export function setAccentColor(color) {
  ACCENT.color = color;
  DeviceEventEmitter.emit('onThemeUpdate');
}

export const onThemeUpdate = (func = () => {}) => {
  return DeviceEventEmitter.addListener('onThemeUpdate', func);
};
export const clearThemeUpdateListener = (func = () => {}) => {
  return DeviceEventEmitter.removeListener('onThemeUpdate', func);
};

export const COLOR_SCHEME = {
  night: false,
  bg: 'white',
  fg: ACCENT.color,
  navbg: '#f6fbfc',
  nav: '#f0f0f0',
  pri: 'black',
  sec: 'white',
  accent: ACCENT.color,
  normal: 'black',
  icon: 'gray',
  errorBg: '#FFD2D2',
  errorText: '#D8000C',
  successBg: '#DFF2BF',
  successText: '#4F8A10',
  warningBg: '#FEEFB3',
  warningText: '#9F6000',
};

export const COLOR_SCHEME_LIGHT = {
  night: false,
  bg: 'white',
  fg: ACCENT.color,
  navbg: '#f6fbfc',
  nav: '#f0f0f0',
  pri: 'black',
  sec: 'white',
  accent: ACCENT.color,
  normal: 'black',
  icon: 'gray',
  errorBg: '#FFD2D2',
  errorText: '#D8000C',
  successBg: '#DFF2BF',
  successText: '#4F8A10',
  warningBg: '#FEEFB3',
  warningText: '#9F6000',
};
export const COLOR_SCHEME_DARK = {
  night: true,
  bg: '#1f1f1f',
  fg: ACCENT.color,
  navbg: '#1c1c1c',
  nav: '#2b2b2b',
  pri: 'white',
  sec: 'black',
  accent: ACCENT.color,
  normal: 'black',
  icon: 'gray',
  errorBg: '#FFD2D2',
  errorText: '#D8000C',
  successBg: '#DFF2BF',
  successText: '#4F8A10',
  warningBg: '#FEEFB3',
  warningText: '#9F6000',
};

//FONT FAMILY
export const FONT = '';
export const FONT_BOLD = '';

//FONT SIZE

export const SIZE = {
  xxs: 10,
  xs: 12,
  sm: 16,
  md: 18,
  lg: 22,
  xl: 28,
  xxl: 32,
  xxxl: 40,
};

export const br = 5; // border radius
export const ph = 10; // padding horizontal
export const pv = 10; // padding vertical
export const opacity = 0.85; // active opacity

// GLOBAL FONT

export const WEIGHT = {
  light: 'Quicksand-Light',
  regular: 'Quicksand-Regular',
  medium: 'Quicksand-Medium',
  semibold: 'Quicksand-SemiBold',
  bold: 'Quicksand-Bold',
};
