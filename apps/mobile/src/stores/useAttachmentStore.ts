//@ts-ignore
import create from 'zustand';
import { editorController } from '../screens/editor/tiptap/utils';

interface AttachmentStore {
  progress?: {
    [name: string]: {
      sent: number;
      total: number;
      hash: string;
      recieved: number;
      type: 'upload' | 'download';
    } | null;
  };
  encryptionProgress: number;
  setEncryptionProgress: (encryptionProgress: number) => void;
  remove: (hash: string) => void;
  setProgress: (
    sent: number,
    total: number,
    hash: string,
    recieved: number,
    type: 'upload' | 'download'
  ) => void;
  loading: { total: number; current: number };
  setLoading: (data: { total: number; current: number }) => void;
}

export const useAttachmentStore = create<AttachmentStore>((set, get) => ({
  progress: {},
  remove: hash => {
    let progress = get().progress;
    if (!progress) return;
    editorController.current?.commands.setAttachmentProgress({
      hash: hash,
      progress: 100,
      type: progress[hash]?.type || 'download'
    });
    progress[hash] = null;
    set({ progress: { ...progress } });
  },
  setProgress: (sent, total, hash, recieved, type) => {
    let progress = get().progress;
    if (!progress) return;
    progress[hash] = { sent, total, hash, recieved, type };
    const progressPercentage = type === 'upload' ? sent / total : recieved / total;
    editorController.current?.commands.setAttachmentProgress({
      hash: hash,
      progress: Math.round(Math.max(progressPercentage * 100, 0)),
      type: type
    });
    set({ progress: { ...progress } });
  },
  encryptionProgress: 0,
  setEncryptionProgress: encryptionProgress => set({ encryptionProgress: encryptionProgress }),
  loading: { total: 0, current: 0 },
  setLoading: data => set({ loading: data })
}));
