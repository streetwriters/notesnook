import { Appearance } from 'react-native';
import { COLOR_SCHEME_DARK, COLOR_SCHEME_LIGHT } from '../utils/color-scheme';
const darkScheme = Appearance.getColorScheme() === 'dark';
export const defaultState = {
  colors: darkScheme ? COLOR_SCHEME_DARK : COLOR_SCHEME_LIGHT
};
