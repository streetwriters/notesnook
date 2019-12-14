import {DeviceEventEmitter, StatusBar, PixelRatio} from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
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

export function getColorScheme(colors) {
  let theme = colors;
  AsyncStorage.getItem('accentColor').then(accentColor => {
    if (typeof accentColor !== 'string') {
      AsyncStorage.setItem('accentColor', colors.accent);
    } else {
      setAccentColor(accentColor);
    }
  });
  AsyncStorage.getItem('theme').then(t => {
    if (typeof t !== 'string') {
      AsyncStorage.setItem('theme', JSON.stringify(theme));

      setColorScheme(COLOR_SCHEME_LIGHT);
    } else {
      let themeToSet = JSON.parse(t);
      themeToSet.night
        ? setColorScheme(COLOR_SCHEME_DARK)
        : setColorScheme(COLOR_SCHEME_LIGHT);
      StatusBar.setBarStyle(
        themeToSet.night ? 'light-content' : 'dark-content',
      );
    }
  });
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
  xxs: 10 * PixelRatio.getFontScale(),
  xs: 12 * PixelRatio.getFontScale(),
  sm: 14 * PixelRatio.getFontScale(),
  md: 18 * PixelRatio.getFontScale(),
  lg: 24 * PixelRatio.getFontScale(),
  xl: 28 * PixelRatio.getFontScale(),
  xxl: 32 * PixelRatio.getFontScale(),
  xxxl: 36 * PixelRatio.getFontScale(),
};

export const br = 5; // border radius
export const ph = 10; // padding horizontal
export const pv = 10; // padding vertical
export const opacity = 0.85; // active opacity

// GLOBAL FONT

export const WEIGHT = {
  light: 'NotoSans',
  regular: 'NotoSans',
  medium: 'NotoSans',
  semibold: 'NotoSerif',
  bold: 'NotoSerif-Bold',
};
