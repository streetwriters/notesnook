import {eSendEvent} from '../services/EventManager';
import {eThemeUpdated} from './Events';
import {Platform, StatusBar} from 'react-native';

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
  errorBg: '#FFB6C1',
  errorText: '#ff6961',
  successBg: '#DFF2BF',
  successText: '#4F8A10',
  warningBg: '#FEEFB3',
  warningText: '#9F6000',
};
export var COLOR_SCHEME = {
  ...fixedColors,
  night: false,
  bg: 'white',
  navbg: '#f7f7f7',
  nav: '#f7f7f7',
  pri: '#000000',
  sec: 'white',
  light: '#ffffff',
};

export const COLOR_SCHEME_LIGHT = {
  ...fixedColors,
  night: false,
  bg: 'white',
  navbg: '#f7f7f7',
  nav: '#f7f7f7',
  input: 'transparent',
  heading: '#000000',
  pri: '#24292e',
  sec: 'white',
  light: '#ffffff',
};
export const COLOR_SCHEME_DARK = {
  ...fixedColors,
  night: true,
  bg: '#1f1f1f',
  navbg: '#2b2b2b',
  input: '#2d2d2d',
  nav: '#2b2b2b',
  heading: '#ffffff',
  pri: '#D3D3D3',
  sec: 'black',
  light: '#ffffff',
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

  StatusBar.setBarStyle(COLOR_SCHEME.night ? 'light-content' : 'dark-content');
  if (Platform.OS === 'android') {
    StatusBar.setTranslucent(true);
    StatusBar.setBackgroundColor(COLOR_SCHEME.bg);
  }
  eSendEvent(eThemeUpdated);

  return COLOR_SCHEME;
}

export function setAccentColor(color) {
  ACCENT.color = color;
  ACCENT.shade = color + '12';

  return ACCENT;
}
