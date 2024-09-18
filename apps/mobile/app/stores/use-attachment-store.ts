/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import create from "zustand";
import { useTabStore } from "../screens/editor/tiptap/use-tab-store";
import { editorController } from "../screens/editor/tiptap/utils";

export type AttachmentGroupProgress = {
  total: number;
  current: number;
  groupId: string;
  filename: string;
  canceled?: boolean;
  success?: boolean;
  error?: any;
  message?: string;
};

interface AttachmentStore {
  progress?: {
    [name: string]: {
      sent: number;
      total: number;
      hash: string;
      recieved: number;
      type: "upload" | "download";
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
    type: "upload" | "download"
  ) => void;
  downloading?: {
    [groupId: string]: Partial<AttachmentGroupProgress> | undefined;
  };
  setDownloading: (data: Partial<AttachmentGroupProgress>) => void;
  uploading?: {
    [groupId: string]: Partial<AttachmentGroupProgress> | undefined;
  };
  setUploading: (data: Partial<AttachmentGroupProgress>) => void;
}

export const useAttachmentStore = create<AttachmentStore>((set, get) => ({
  progress: {},
  remove: (hash) => {
    const progress = get().progress;
    if (!progress) return;
    editorController.current?.commands.setAttachmentProgress(
      {
        hash: hash,
        progress: 100
      },
      useTabStore.getState().currentTab
    );
    progress[hash] = null;
    set({ progress: { ...progress } });
  },
  setProgress: (sent, total, hash, recieved, type) => {
    const progress = get().progress;
    if (!progress) return;
    progress[hash] = { sent, total, hash, recieved, type };
    const progressPercentage =
      type === "upload" ? sent / total : recieved / total;

    editorController.current?.commands.setAttachmentProgress(
      {
        hash: hash,
        //@ts-ignore
        progress: Math.round(Math.max(progressPercentage * 100, 0))
      },
      useTabStore.getState().currentTab
    );
    set({ progress: { ...progress } });
  },
  encryptionProgress: 0,
  setEncryptionProgress: (encryptionProgress) =>
    set({ encryptionProgress: encryptionProgress }),

  downloading: {},
  setDownloading: (data) =>
    !data.groupId
      ? null
      : set({
          downloading: {
            ...get().downloading,
            [data.groupId]: data
          }
        }),
  uploading: {},
  setUploading: (data) =>
    !data.groupId
      ? null
      : set({
          uploading: {
            ...get().uploading,
            [data.groupId]: data
          }
        })
}));
