//@ts-ignore
import create from 'zustand';

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
    let _p = get().progress;
    if (!_p) return;
    _p[hash] = null;
    // tiny.call(
    //   EditorWebView,
    //   `
    // (function() {
    //   let progress = ${JSON.stringify({
    //     loaded: 1,
    //     total: 1,
    //     hash
    //   })}
    // tinymce.activeEditor._updateAttachmentProgress(progress);
    // })()`
    // );
    set({ progress: { ..._p } });
  },
  setProgress: (sent, total, hash, recieved, type) => {
    let _p = get().progress;
    if (!_p) return;
    _p[hash] = { sent, total, hash, recieved, type };
    let progress = { total, hash, loaded: type === 'download' ? recieved : sent };
    // tiny.call(
    //   EditorWebView,
    //   `
    // (function() {
    //   let progress = ${JSON.stringify(progress)}
    //   tinymce.activeEditor._updateAttachmentProgress(progress);
    // })()`
    // );
    set({ progress: { ..._p } });
  },
  encryptionProgress: 0,
  setEncryptionProgress: encryptionProgress => set({ encryptionProgress: encryptionProgress }),
  loading: { total: 0, current: 0 },
  setLoading: data => set({ loading: data })
}));
