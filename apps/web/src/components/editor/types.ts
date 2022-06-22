import { Attachment } from "./plugins/picker";

export type CharacterCounter = {
  words: () => number;
  characters: () => number;
};

export interface IEditor {
  focus: () => void;
  undo: () => void;
  redo: () => void;
  attachFile: (file: Attachment) => void;
  loadImage: (hash: string, src: string) => void;
  sendAttachmentProgress: (
    hash: string,
    type: string,
    progress: number
  ) => void;
}
