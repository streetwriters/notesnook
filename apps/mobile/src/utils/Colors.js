import {eSendEvent} from '../services/EventManager';
import {eThemeUpdated} from './Events';
import {NativeModules, Platform, StatusBar} from 'react-native';
import {AndroidModule} from '.';

export const ACCENT = {
  color: '#008837',
  shade: '#00883712'
};

export const COLORS_NOTE = {
  red: '#f44336',
  orange: '#FF9800',
  yellow: '#F9D71C',
  green: '#4CAF50',
  blue: '#2196F3',
  purple: '#673AB7',
  gray: '#9E9E9E'
};

const fixedColors = {
  accent: ACCENT.color,
  shade: ACCENT.shade,
  fg: ACCENT.color,
  normal: 'black',
  icon: 'gray',
  transGray: '#00000010',
  errorBg: '#FFB6C1',
  errorText: '#ff6961',
  successBg: '#DFF2BF',
  successText: '#4F8A10',
  warningBg: '#FF990020',
  warningText: '#FF9900',
  red: '#f44336',
  orange: '#FF9800',
  yellow: '#FFD600',
  green: '#4CAF50',
  blue: '#2196F3',
  purple: '#673AB7',
  gray: '#9E9E9E',
  discord: '#5865F2'
};
export var COLOR_SCHEME = {
  ...fixedColors,
  night: false,
  bg: '#ffffff',
  navbg: '#f7f7f7',
  nav: '#f7f7f7',
  pri: '#424242',
  sec: 'white',
  light: '#ffffff'
};

export const COLOR_SCHEME_LIGHT = {
  ...fixedColors,
  night: false,
  bg: '#ffffff',
  navbg: '#f7f7f7',
  nav: '#f7f7f7',
  input: 'transparent',
  heading: '#212121',
  pri: '#505050',
  sec: '#ffffff',
  light: '#ffffff',
  transGray: '#00000010',
  border: '#E8E8E8',
  placeholder: '#a9a9a9'
};
export const COLOR_SCHEME_PITCH_BLACK = {
  ...fixedColors,
  night: true,
  bg: '#000000',
  navbg: '#2b2b2b',
  input: '#2d2d2d',
  nav: '#1a1a1a',
  heading: '#E8E8E8',
  pri: '#C0C0C0',
  sec: 'black',
  light: '#ffffff',
  transGray: '#ffffff10',
  border: '#383838',
  placeholder: '#404040'
};

export const COLOR_SCHEME_DARK = {
  ...fixedColors,
  night: true,
  bg: '#1f1f1f',
  navbg: '#2b2b2b',
  input: '#2d2d2d',
  nav: '#2b2b2b',
  heading: '#E8E8E8',
  pri: '#C0C0C0',
  sec: 'black',
  light: '#ffffff',
  transGray: '#ffffff10',
  border: '#383838',
  placeholder: '#404040'
};

export function getCurrentColors() {
  return COLOR_SCHEME;
}

export function setColorScheme(colors = COLOR_SCHEME, accent = ACCENT) {
  COLOR_SCHEME = {...colors, accent: accent.color, shade: accent.shade};

  StatusBar.setBarStyle(
    COLOR_SCHEME.night ? 'light-content' : 'dark-content',
    true
  );

  if (Platform.OS === 'android') {
    AndroidModule.setBackgroundColor(COLOR_SCHEME.bg);
    StatusBar.setBackgroundColor('transparent', true);
    StatusBar.setTranslucent(true, true);
  }
  eSendEvent(eThemeUpdated);

  return COLOR_SCHEME;
}

export function setAccentColor(color) {
  ACCENT.color = color;
  ACCENT.shade = color + '12';

  return ACCENT;
}

export function updateStatusBarColor() {
  StatusBar.setBarStyle(
    COLOR_SCHEME.night ? 'light-content' : 'dark-content',
    true
  );
  if (Platform.OS === 'android') {
    StatusBar.setBackgroundColor('transparent', true);
    StatusBar.setTranslucent(true, true);
  }
}
