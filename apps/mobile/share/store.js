import { Appearance } from 'react-native';
import create from 'zustand';
import {
  ACCENT, COLOR_SCHEME_DARK,
  COLOR_SCHEME_LIGHT,
  setAccentColor
} from '../src/utils/Colors';
import { MMKV } from '../src/utils/mmkv';

export const useShareStore = create((set, get) => ({
  colors:
    Appearance.getColorScheme() === 'dark'
      ? COLOR_SCHEME_DARK
      : COLOR_SCHEME_LIGHT,
  accent:ACCENT,
  setAccent: async () => {
    let accent = await MMKV.getItem('accentColor');
    if (accent) {
      accent = {
        color:accent,
        shade:accent + "12"
      }
      set({accent:accent});
    };
  },
  appendNote: null,
  setAppendNote: note => {
    MMKV.setItem('shareMenuAppendNote', JSON.stringify(note));
    set({appendNote: note});
  },
  restoreAppendNote: async () => {
    let note = await MMKV.getItem('shareMenuAppendNote');
    if (note) {
      note = JSON.parse(note);
      set({appendNote: note});
    }
  }
}));
