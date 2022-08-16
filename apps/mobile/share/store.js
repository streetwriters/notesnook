import { Appearance } from 'react-native';
import create from 'zustand';
import { ACCENT, COLOR_SCHEME_DARK, COLOR_SCHEME_LIGHT } from '../app/utils/color-scheme';
import { MMKV } from '../app/common/database/mmkv';

export const useShareStore = create((set, get) => ({
  colors: Appearance.getColorScheme() === 'dark' ? COLOR_SCHEME_DARK : COLOR_SCHEME_LIGHT,
  accent: ACCENT,
  setAccent: async () => {
    let appSettings = MMKV.getString('appSettings');

    if (appSettings) {
      appSettings = JSON.parse(appSettings);
      let accentColor = appSettings.theme?.accent || ACCENT.color;

      let accent = {
        color: accentColor,
        shade: accentColor + '12'
      };
      set({ accent: accent });
    }
  },
  setColors: () => {
    set({
      colors: Appearance.getColorScheme() === 'dark' ? COLOR_SCHEME_DARK : COLOR_SCHEME_LIGHT
    });
  },
  appendNote: null,
  setAppendNote: note => {
    MMKV.setItem('shareMenuAppendNote', JSON.stringify(note));
    set({ appendNote: note });
  },
  restoreAppendNote: async () => {
    let note = MMKV.getString('shareMenuAppendNote');
    if (note) {
      note = JSON.parse(note);
      set({ appendNote: note });
    }
  }
}));
