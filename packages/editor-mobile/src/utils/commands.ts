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

import { Attachment, ImageAttributes, LinkAttributes } from "@notesnook/editor";
import { Settings } from ".";

globalThis.commands = {
  clearContent: (tabId: string) => {
    try {
      const editor = editors[tabId];
      const editorController = editorControllers[tabId];
      const editorTitle = editorTitles[tabId];
      const statusBar = statusBars[tabId];

      if (editor) {
        editor?.commands.blur();
        editor?.commands.clearContent(false);
      }

      if (editorController) {
        editorController.content.current = "";
        editorController.onUpdate();
        editorController.setTitle("");
      }

      if (editorTitle?.current) {
        editorTitle.current?.blur();
        editorTitle.current.value = "";
      }

      if (statusBar) {
        statusBar.current.resetWords();
        statusBar.current.set({ date: "", saved: "" });
      }
    } catch (error) {
      logger("error", "clearContent", error, (error as Error).stack);
    }
  },

  focus: (tabId: string, locked: boolean) => {
    const editorController = editorControllers[tabId];
    if (locked) {
      editorController?.focusPassInput();
    } else {
      editors[tabId]?.commands.focus();
    }
  },

  blur: (tabId: string) => {
    const editor = editors[tabId];
    const editorTitle = editorTitles[tabId];
    if (editor) editor.commands.blur();
    if (editorTitle?.current) editorTitle.current.blur();
    editorControllers[tabId]?.blurPassInput();
  },

  setSessionId: (id: string | undefined) => {
    globalThis.sessionId = id;
  },

  setStatus: (date: string | undefined, saved: string, tabId: string) => {
    const statusBar = statusBars[tabId];
    if (statusBar?.current) {
      statusBar.current.set({ date: date || "", saved });
    }
  },

  setLoading: (loading?: boolean, tabId?: string) => {
    if (tabId) {
      const editorController = editorControllers[tabId];
      editorController?.setLoading(loading || false);
      logger("info", editorController?.setLoading);
    }
  },

  setInsets: (insets: any) => {
    if (typeof safeAreaController !== "undefined") {
      safeAreaController.update(insets);
    }
  },

  updateSettings: (settings?: Partial<Settings>) => {
    if (typeof globalThis.settingsController !== "undefined") {
      globalThis.settingsController.update(settings as Settings);
    }
  },

  setSettings: (settings?: Partial<Settings>) => {
    if (typeof globalThis.settingsController !== "undefined") {
      globalThis.settingsController.update(settings as Settings);
    }
  },

  setTags: async (tabId: string, tags: any) => {
    const current = globalThis.editorTags[tabId];
    if (current?.current) {
      current.current.setTags(
        tags.map((tag: any) => ({
          title: tag.title,
          alias: tag.title,
          id: tag.id,
          type: tag.type
        }))
      );
    }
  },

  clearTags: (tabId: string) => {
    const tags = editorTags[tabId];
    if (tags?.current) {
      tags.current.setTags([]);
    }
  },

  insertAttachment: (attachment: Attachment, tabId: number) => {
    const editor = editors[tabId];
    if (editor) {
      editor.commands.insertAttachment(attachment);
    }
  },

  setAttachmentProgress: (
    attachmentProgress: Partial<Attachment>,
    tabId: number
  ) => {
    const editor = editors[tabId];
    if (editor) {
      editor.commands.updateAttachment(attachmentProgress, {
        preventUpdate: true,
        query: (attachment) => attachment.hash === attachmentProgress.hash
      });
    }
  },

  insertImage: (
    image: Omit<ImageAttributes, "bloburl"> & { dataurl: string },
    tabId: number
  ) => {
    const editor = editors[tabId];
    if (editor) {
      editor.commands.insertImage({
        ...image
      });
    }
  },

  handleBack: () => {
    return window.dispatchEvent(
      new Event("handleBackPress", { cancelable: true })
    );
  },

  keyboardShown: (keyboardShown: boolean) => {
    globalThis["keyboardShown"] = keyboardShown;
  },

  getTableOfContents: (tabId: string) => {
    return editorControllers[tabId]?.getTableOfContents() || [];
  },

  focusPassInput: (tabId: string) => {
    return editorControllers[tabId]?.focusPassInput() || [];
  },

  blurPassInput: (tabId: string) => {
    return editorControllers[tabId]?.blurPassInput() || [];
  },

  createInternalLink: (attributes: LinkAttributes, resolverId: string) => {
    if (globalThis.pendingResolvers[resolverId]) {
      globalThis.pendingResolvers[resolverId](attributes);
    }
  },

  dismissCreateInternalLinkRequest: (resolverId: string) => {
    if (globalThis.pendingResolvers[resolverId]) {
      globalThis.pendingResolvers[resolverId](undefined);
    }
  },

  scrollIntoViewById: (id: string, tabId: string) => {
    return editorControllers[tabId]?.scrollIntoView(id) || [];
  }
};
