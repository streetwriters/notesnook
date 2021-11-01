import {Appearance} from 'react-native';
import create from 'zustand';
import {COLOR_SCHEME_DARK, COLOR_SCHEME_LIGHT} from '../src/utils/Colors';
import {MMKV} from '../src/utils/mmkv';

export const useShareStore = create((set, get) => ({
  colors:
    Appearance.getColorScheme() === 'dark'
      ? COLOR_SCHEME_DARK
      : COLOR_SCHEME_LIGHT,
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
