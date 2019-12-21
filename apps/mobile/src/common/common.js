import {DeviceEventEmitter, StatusBar, PixelRatio} from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';

//COLOR SCHEME
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
  errorText: '#D8000C',
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
  pri: 'black',
  sec: 'white',
  ...fixedColors,
};

export const COLOR_SCHEME_LIGHT = {
  night: false,
  bg: 'white',
  navbg: '#f6fbfc',
  nav: '#f0f0f0',
  pri: 'black',
  sec: 'white',
  ...fixedColors,
};
export const COLOR_SCHEME_DARK = {
  night: true,
  bg: '#1f1f1f',
  navbg: '#1c1c1c',
  nav: '#2b2b2b',
  pri: 'white',
  sec: 'black',
  ...fixedColors,
};

//FONT FAMILY
//export const FONT = '';
//export const FONT_BOLD = '';

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

export function setColorScheme(colors = COLOR_SCHEME, accent = ACCENT) {
  COLOR_SCHEME = {...colors, accent: accent.color, shade: accent.shade};

  DeviceEventEmitter.emit('onThemeUpdate');

  return COLOR_SCHEME;
}

export async function getColorScheme(colors) {
  let accentColor = await AsyncStorage.getItem('accentColor');
  let t = await AsyncStorage.getItem('theme');

  if (typeof accentColor !== 'string') {
    AsyncStorage.setItem('accentColor', colors.accent);
  } else {
    setAccentColor(accentColor);
  }

  if (typeof t !== 'string') {
    AsyncStorage.setItem('theme', JSON.stringify(colors));
    setColorScheme(COLOR_SCHEME_LIGHT);
  } else {
    let themeToSet = JSON.parse(t);
    themeToSet.night
      ? setColorScheme(COLOR_SCHEME_DARK)
      : setColorScheme(COLOR_SCHEME_LIGHT);
    StatusBar.setBarStyle(themeToSet.night ? 'light-content' : 'dark-content');
  }

  DeviceEventEmitter.emit('onThemeUpdate');
  return COLOR_SCHEME;
}

export function setAccentColor(color) {
  ACCENT.color = color;
  ACCENT.shade = color + '12';
  return ACCENT;
}

export const onThemeUpdate = (func = () => {}) => {
  return DeviceEventEmitter.addListener('onThemeUpdate', func);
};
export const clearThemeUpdateListener = (func = () => {}) => {
  return DeviceEventEmitter.removeListener('onThemeUpdate', func);
};
