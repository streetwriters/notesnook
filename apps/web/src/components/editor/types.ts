import { HTMLContent } from "@tiptap/react";

export type CharacterCounter = {
  words: () => number;
  characters: () => number;
};

export interface IEditor {
  focus: () => void;
  undo: () => void;
  redo: () => void;
}
