//@ts-ignore
import create, { State } from 'zustand';
import { history } from '../utils';

type Item = {
  id: string;
};

export interface SelectionStore extends State {
  selectedItemsList: Array<unknown>;
  selectionMode: boolean;
  setAll: (all: Array<unknown>) => void;
  setSelectionMode: (mode: boolean) => void;
  setSelectedItem: (item: Item) => void;
  clearSelection: (noanimation: boolean) => void;
}

export const useSelectionStore = create<SelectionStore>((set, get) => ({
  selectedItemsList: [],
  selectionMode: false,
  setAll: all => {
    //@ts-ignore
    history.selectedItemsList = all;
    set({ selectedItemsList: all });
  },
  setSelectionMode: mode => {
    if (!mode) {
      history.selectedItemsList = [];
      history.selectionMode = false;
    } else {
      history.selectionMode = true;
    }
    set({
      selectionMode: mode,
      selectedItemsList: mode ? get().selectedItemsList : []
    });
  },
  setSelectedItem: item => {
    let selectedItems = get().selectedItemsList;
    let index = selectedItems.findIndex((i: any) => i.id === item.id);
    if (index !== -1) {
      selectedItems.splice(index, 1);
    } else {
      selectedItems.push(item);
    }
    selectedItems = [...new Set(selectedItems)];
    //@ts-ignore
    history.selectedItemsList = selectedItems;
    history.selectionMode = selectedItems.length > 0 ? get().selectionMode : false;
    set({
      selectedItemsList: selectedItems,
      selectionMode: history.selectionMode
    });
  },
  clearSelection: noanimation => {
    history.selectedItemsList = [];
    history.selectionMode = false;
    set({ selectionMode: false, selectedItemsList: [] });
  }
}));
