import {StatusBar, PixelRatio} from 'react-native';
import FastStorage from 'react-native-fast-storage';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
} from '../services/eventManager';
import {eThemeUpdated} from '../services/events';

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
  pri: '#000000',
  sec: 'white',
  ...fixedColors,
};

export const COLOR_SCHEME_LIGHT = {
  night: false,
  bg: 'white',
  navbg: '#f6fbfc',
  nav: '#f0f0f0',
  pri: '#000000',
  sec: 'white',
  ...fixedColors,
};
export const COLOR_SCHEME_DARK = {
  night: true,
  bg: '#1f1f1f',
  navbg: '#1c1c1c',
  nav: '#2b2b2b',
  pri: '#ffffff',
  sec: 'black',
  ...fixedColors,
};

//FONT FAMILY
//export const FONT = '';
//export const FONT_BOLD = '';

//FONT SIZE

export const SIZE = {
  xxs: PixelRatio.getFontScale() * 10,
  xs: PixelRatio.getFontScale() * 12,
  sm: PixelRatio.getFontScale() * 15,
  md: PixelRatio.getFontScale() * 18,
  lg: PixelRatio.getFontScale() * 24,
  xl: PixelRatio.getFontScale() * 28,
  xxl: PixelRatio.getFontScale() * 32,
  xxxl: PixelRatio.getFontScale() * 36,
};

export const br = 5; // border radius
export const ph = 10; // padding horizontal
export const pv = 10; // padding vertical
export const opacity = 0.5; // active opacity

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

  eSendEvent(eThemeUpdated);

  return COLOR_SCHEME;
}

export async function getColorScheme() {
  let accentColor = await FastStorage.getItem('accentColor');
  let t = await FastStorage.getItem('theme');

  if (typeof accentColor !== 'string') {
    FastStorage.setItem('accentColor', '#0560FF');
    setAccentColor('#0560FF');
  } else {
    setAccentColor(accentColor);
  }

  if (typeof t !== 'string') {
    FastStorage.setItem('theme', JSON.stringify({night: false}));
    setColorScheme(COLOR_SCHEME_LIGHT);
  } else {
    let themeToSet = JSON.parse(t);

    themeToSet.night
      ? setColorScheme(COLOR_SCHEME_DARK)
      : setColorScheme(COLOR_SCHEME_LIGHT);
    StatusBar.setBarStyle(themeToSet.night ? 'light-content' : 'dark-content');
  }

  eSendEvent(eThemeUpdated);

  return COLOR_SCHEME;
}

export function setAccentColor(color) {
  ACCENT.color = color;
  ACCENT.shade = color + '12';
  return ACCENT;
}

export const onThemeUpdate = (func = () => {}) => {
  return eSubscribeEvent(eThemeUpdated, func);
};
export const clearThemeUpdateListener = (func = () => {}) => {
  return eUnSubscribeEvent(eThemeUpdated, func);
};
