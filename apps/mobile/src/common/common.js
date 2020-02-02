import {Platform, StatusBar, Dimensions, PixelRatio} from 'react-native';
import FastStorage from 'react-native-fast-storage';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
} from '../services/eventManager';
import {eThemeUpdated} from '../services/events';
import {DDS} from '../../App';

const {height, width} = Dimensions.get('window');
const standardLength = width > height ? width : height;

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

const windowSize = Dimensions.get('window');
const adjustedWidth = windowSize.width * PixelRatio.get();
const adjustedHeight = windowSize.height * PixelRatio.get();
const pixelDensity = PixelRatio.get();

const getDeviceSize = () => {
  let dpi = getDpi(pixelDensity);
  let deviceWidthInInches = adjustedWidth / dpi;
  let deviceHeightInInches = adjustedHeight / dpi;
  let diagonalSize = Math.sqrt(
    Math.pow(deviceWidthInInches, 2) + Math.pow(deviceHeightInInches, 2),
  );

  return diagonalSize;
};

const getDpi = pd => {
  if (pd === 1 || pd < 1) {
    return 160 * pd;
  } else if (pd > 1 && pd <= 1.5) {
    let multiplier = pd / 1.5;
    return 240 * multiplier;
  } else if (pd > 1.5 && pd <= 2) {
    let multiplier = pd / 2;
    return 320 * multiplier;
  } else if (pd > 2 && pd <= 3) {
    let multiplier = pd / 3;
    return 480 * multiplier;
  } else if (pd > 3 && pd <= 3.5) {
    let multiplier = pd / 3.5;
    return 520 * multiplier;
  } else if (pd > 3.5) {
    return 550;
  }
};

const correction = (size, multiplier) => {
  let dSize = getDeviceSize();

  if (dSize > 4 && dSize <= 5.3 && pixelDensity <= 3) {
    return size * 0.87;
  } else if (dSize > 5.5 && dSize < 6.5 && pixelDensity <= 3) {
    return size * 0.93;
  } else if (dSize >= 6.5 && dSize <= 7.2) {
    return size * multiplier;
  } else if (dSize > 7.2 && dSize <= 8.5) {
    return size * (multiplier + 0.05);
  } else if (dSize > 8.5 && dSize <= 9.8) {
    return size * (multiplier + 0.05);
  } else if (dSize > 9.8) {
    return size;
  } else {
    return size;
  }
};

export const normalize = size => {
  let pd = pixelDensity;

  if (pd === 1 || pd < 1) {
    return correction(size, 0.75);
  } else if (pd > 1 && pd <= 1.5) {
    return correction(size, 0.8);
  } else if (pd > 1.5 && pd <= 2) {
    return correction(size, 0.84);
  } else if (pd > 2 && pd <= 3) {
    return correction(size, 0.87);
  } else if (pd > 3) {
    return size;
  }
};

export const SIZE = {
  xxs: 10,
  xs: 12,
  sm: normalize(15),
  md: normalize(18),
  lg: normalize(24),
  xl: normalize(28),
  xxl: normalize(32),
  xxxl: normalize(36),
};

export const br = 5; // border radius
export const ph = normalize(10); // padding horizontal
export const pv = normalize(10); // padding vertical
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
