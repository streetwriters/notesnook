//@ts-ignore
import create, { State } from "zustand";
import { eSubscribeEvent, eUnSubscribeEvent } from "../services/event-manager";

export interface EditorStore extends State {
  currentEditingNote: string | null;
  setCurrentlyEditingNote: (note: string | null) => void;
  sessionId: string | null;
  setSessionId: (sessionId: string | null) => void;
  searchReplace: boolean;
  setSearchReplace: (searchReplace: boolean) => void;
  searchSelection: string | null;
  readonly: boolean;
  setReadonly: (readonly: boolean) => void;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  currentEditingNote: null,
  setCurrentlyEditingNote: (note) => set({ currentEditingNote: note }),
  sessionId: null,
  setSessionId: (sessionId) => {
    console.log(sessionId, "session id");
    // tiny.call(EditorWebView, `sessionId="${sessionId}";`);
    set({ sessionId });
  },
  searchReplace: false,
  searchSelection: null,
  readonly: false,
  setReadonly: (readonly) => {
    set({ readonly: readonly });
  },
  setSearchReplace: (searchReplace) => {
    if (!searchReplace) {
      set({ searchSelection: null, searchReplace: false });
      return;
    }
    const func = (value: string) => {
      eUnSubscribeEvent("selectionvalue", func);
      console.log("setSearchReplace:", value, value.length);
      if (!value && get().searchReplace) {
        //  endSearch();
        return;
      }
      set({ searchSelection: value, searchReplace: true });
    };
    eSubscribeEvent("selectionvalue", func);
    // tiny.call(
    //   EditorWebView,
    //   `(function() {
    //   if (editor) {
    //     reactNativeEventHandler('selectionvalue',editor.selection.getContent());
    //   }
    // })();`
    // );
  }
}));
