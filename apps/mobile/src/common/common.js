import Storage from '../utils/storage';
//COLOR SCHEME

export function setColorScheme(
  night = false,
  bg = 'white',
  fg = '#1790F3',
  nav = '#f2f2f2',
  pri = 'black',
  sec = 'white',
  accent = '#1790F3',
  normal = 'black',
  icon = ICONS_COLOR,
) {
  COLOR_SCHEME.bg = bg;
  COLOR_SCHEME.fg = fg;
  COLOR_SCHEME.nav = nav;
  COLOR_SCHEME.pri = pri;
  COLOR_SCHEME.sec = sec;
  COLOR_SCHEME.accent = accent;
  COLOR_SCHEME.normal = normal;
  COLOR_SCHEME.night = night;
  COLOR_SCHEME.icon = icon;

  return;
}

export const COLOR_SCHEME = {
  night: false,
  bg: 'white',
  fg: '#0560FF',
  navbg: '#f6fbfc',
  pri: 'black',
  sec: 'white',
  accent: '#0560FF',
  normal: 'black',
  icon: 'gray',
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
