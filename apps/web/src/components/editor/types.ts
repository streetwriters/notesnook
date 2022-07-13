import { Attachment } from "./picker";

export type NoteStatistics = {
  words: {
    total: number;
    selected?: number;
  };
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
