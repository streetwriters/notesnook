import { Dimensions, PixelRatio, StatusBar, Platform, Appearance } from 'react-native';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
} from '../services/eventManager';
import { eThemeUpdated } from '../services/events';
import { DDS } from '../utils/utils';
import { MMKV } from '../utils/storage';

export const scale = {
  fontScale: 1,
};
const { height, width } = Dimensions.get('window');

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
  nav: '#e1e4e8',
  pri: '#000000',
  sec: 'white',
  ...fixedColors,
};

export const COLOR_SCHEME_LIGHT = {
  night: false,
  bg: 'white',
  navbg: '#f6fbfc',
  nav: '#e1e4e8',
  heading:'#000000',
  pri: '#24292e',
  sec: 'white',
  ...fixedColors,
};
export const COLOR_SCHEME_DARK = {
  night: true,
  bg: '#1f1f1f',
  navbg: '#1c1c1c',
  nav: '#2d2d2d',
  heading:'#ffffff',
  pri: '#D3D3D3',
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

  if (dSize >= 4 && dSize <= 5.3 && pixelDensity <= 3) {
    return size * 0.92;
  } else if (dSize > 5.3 && dSize < 7 && pixelDensity < 3 && !DDS.isTab) {
    if (Platform.OS === 'ios') {
      return size;
    }
    return size * 0.93;
  } else if (dSize <= 7 && pixelDensity >= 3 && !DDS.isTab) {
    return size * 0.98;
  } else if (dSize >= 6.5 && dSize <= 7.2 && DDS.isTab) {
    return size * multiplier;
  } else if (dSize > 7.2 && dSize <= 8.5 && DDS.isTab) {
    return size * (multiplier + 0.05);
  } else if (dSize > 8.5 && dSize <= 9.8 && DDS.isTab) {
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
    return correction(size, 1);
  }
};

export const SIZE = {
  xxs: 10 * scale.fontScale,
  xs: 12 * scale.fontScale,
  sm: normalize(15) * scale.fontScale,
  md: normalize(17) * scale.fontScale,
  lg: normalize(24) * scale.fontScale,
  xl: normalize(27) * scale.fontScale,
  xxl: normalize(31) * scale.fontScale,
  xxxl: normalize(34) * scale.fontScale,
};

export function updateSize() {
  SIZE.xxs = 10 * scale.fontScale;
  SIZE.xs = 12 * scale.fontScale;
  SIZE.sm = normalize(15) * scale.fontScale;
  SIZE.md = normalize(17) * scale.fontScale;
  SIZE.lg = normalize(24) * scale.fontScale;
  SIZE.xl = normalize(27) * scale.fontScale;
  SIZE.xxl = normalize(31) * scale.fontScale;
  SIZE.xxxl = normalize(34) * scale.fontScale;
  ph = normalize(10) * scale.fontScale;
  pv = normalize(10) * scale.fontScale;
}

export const br = 5; // border radius
export var ph = normalize(10); // padding horizontal
export var pv = normalize(10); // padding vertical
export const opacity = 0.5; // active opacity

// GLOBAL FONT

export const WEIGHT = {
  light: 'DMSans-Regular',
  regular: 'DMSans-Regular',
  medium: 'DMSans-Regular',
  semibold: 'DMSerifText-Regular',
  bold: 'DMSerifText-Regular',
};

export function setColorScheme(colors = COLOR_SCHEME, accent = ACCENT) {
  COLOR_SCHEME = { ...colors, accent: accent.color, shade: accent.shade };

  eSendEvent(eThemeUpdated);

  return COLOR_SCHEME;
}

export async function getColorScheme(useSystemTheme) {
  let accentColor;
  try {
    accentColor = await MMKV.getStringAsync('accentColor');
  } catch (e) { }
  let t;
  try {
    t = await MMKV.getStringAsync('theme');
  } catch (e) { }

  if (typeof accentColor !== 'string') {
    MMKV.setStringAsync('accentColor', '#0560FF');
    setAccentColor('#0560FF');
  } else {
    setAccentColor(accentColor);
  }
  if (useSystemTheme) {
    
    StatusBar.setBarStyle(Appearance.getColorScheme() === "dark" ? 'light-content' : 'dark-content');
    return Appearance.getColorScheme() === "dark" ? COLOR_SCHEME_DARK : COLOR_SCHEME_LIGHT
  }
  if (typeof t !== 'string') {
    MMKV.setStringAsync('theme', JSON.stringify({ night: false }));
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

export const onThemeUpdate = (func = () => { }) => {
  return eSubscribeEvent(eThemeUpdated, func);
};
export const clearThemeUpdateListener = (func = () => { }) => {
  return eUnSubscribeEvent(eThemeUpdated, func);
};
