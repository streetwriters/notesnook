//@ts-ignore
import create, { State } from 'zustand';
export interface SearchStore extends State {
  searchResults: object[];
  searching: boolean;
  searchStatus: string | null;
  setSearchResults: (results: object[]) => void;
  setSearchStatus: (searching: boolean, status: string | null) => void;
}

export const useSearchStore = create<SearchStore>((set, get) => ({
  searchResults: [],
  searching: false,
  searchStatus: null,
  setSearchResults: results => set({ searchResults: results }),
  setSearchStatus: (searching, status) => set({ searching, searchStatus: status })
}));
