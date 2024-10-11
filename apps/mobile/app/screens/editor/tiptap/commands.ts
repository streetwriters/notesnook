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

import { Note } from "@notesnook/core";
import type { Attachment } from "@notesnook/editor";
import type { ImageAttributes } from "@notesnook/editor";
import type { LinkAttributes } from "@notesnook/editor";
import { createRef, RefObject } from "react";
import { Platform } from "react-native";
import { EdgeInsets } from "react-native-safe-area-context";
import WebView from "react-native-webview";
import { db } from "../../../common/database";
import { sleep } from "../../../utils/time";
import { Settings } from "./types";
import { useTabStore } from "./use-tab-store";
import { getResponse, randId, textInput } from "./utils";

type Action = { job: string; id: string };

async function call(webview: RefObject<WebView | undefined>, action?: Action) {
  if (!webview.current || !action) return;
  setImmediate(() => webview.current?.injectJavaScript(action.job));
  const response = await getResponse(action.id);
  // if (!response) {
  //   console.warn("webview job failed", action.id);
  // }
  return response ? response.value : response;
}

const fn = (fn: string, name?: string) => {
  const id = randId("fn_");
  return {
    job: `(async () => {
      if (typeof __PLATFORM__ === "undefined") __PLATFORM__ = "${Platform.OS}";
      try {
        let response = true;
        ${fn}
        post("${id}",response);
      } catch(e) {
        const DEV_MODE = ${__DEV__};
        if (DEV_MODE && typeof logger !== "undefined") logger('error', "webview: ", e.message, e.stack, "${name}");
      }
      return true;
    })();true;`,
    id: id
  };
};

class Commands {
  ref = createRef<WebView | undefined>();
  previousSettings: Partial<Settings> | null;
  constructor(ref: RefObject<WebView>) {
    this.ref = ref;
    this.previousSettings = null;
  }

  async doAsync<T>(job: string, name?: string) {
    if (!this.ref.current) return false;
    return call(this.ref, fn(job, name)) as Promise<T>;
  }

  focus = async (tabId: number) => {
    if (!this.ref.current) return;
    if (Platform.OS === "android") {
      //this.ref.current?.requestFocus();
      setTimeout(async () => {
        if (!this.ref) return;
        textInput.current?.focus();

        const locked = useTabStore.getState().getTab(tabId)?.locked;
        await this.doAsync(
          locked
            ? `editorControllers[${tabId}]?.focusPassInput();`
            : `editors[${tabId}]?.commands.focus()`,
          "focus"
        );

        this.ref?.current?.requestFocus();
      }, 1);
    } else {
      await sleep(400);
      await this.doAsync(`editors[${tabId}]?.commands.focus()`, "focus");
    }
  };

  blur = async (tabId: number) =>
    await this.doAsync(
      `
    const editor = editors[${tabId}];
    const editorTitle = editorTitles[${tabId}];
    typeof editor !== "undefined" && editor.commands.blur();
    typeof editorTitle !== "undefined" && editorTitle.current && editorTitle.current.blur();
    
    editorControllers[${tabId}]?.blurPassInput();

  `,
      "blur"
    );

  clearContent = async (tabId: number) => {
    this.previousSettings = null;
    await this.doAsync(
      `
const editor = editors[${tabId}];
const editorController = editorControllers[${tabId}];
const editorTitle = editorTitles[${tabId}];
const statusBar = statusBars[${tabId}];

if (typeof editor !== "undefined") {
  editor.commands.blur();
  editor.commands.clearContent(false);
}

typeof editorTitle !== "undefined" && editorTitle.current && editorTitle.current?.blur();
if (typeof editorController.content !== undefined) editorController.content.current = '';
editorController.onUpdate();
editorController.setTitle('');
if (typeof statusBar !== "undefined") {
  statusBar.current.resetWords();
  statusBar.current.set({date:"",saved:""});
}`,
      "clearContent"
    );
  };

  setSessionId = async (id: string | null) =>
    await this.doAsync(`globalThis.sessionId = "${id}";`);

  setStatus = async (
    date: string | undefined,
    saved: string,
    tabId: number
  ) => {
    await this.doAsync(
      `
      const statusBar = statusBars[${tabId}];
      typeof statusBar !== "undefined" && statusBar.current.set({date:"${date}",saved:"${saved}"})`,
      "setStatus"
    );
  };

  setPlaceholder = async (placeholder: string) => {
    // await this.doAsync(`
    // const element = document.querySelector(".is-editor-empty");
    // if (element) {
    //   element.setAttribute("data-placeholder","${placeholder}");
    // }
    // `);
  };

  setLoading = async (loading?: boolean, tabId?: number) => {
    await this.doAsync(`
    const editorController = editorControllers[${
      tabId || useTabStore.getState().currentTab
    }];
    editorController.setLoading(${loading})
    `);
  };

  setInsets = async (insets: EdgeInsets) => {
    await this.doAsync(`
      if (typeof safeAreaController !== "undefined") {
        safeAreaController.update(${JSON.stringify(insets)}) 
      }
    `);
  };

  updateSettings = async (settings?: Partial<Settings>) => {
    if (!this.previousSettings) return;
    this.previousSettings = {
      ...this.previousSettings,
      ...settings
    };
    await this.doAsync(`
      if (typeof globalThis.settingsController !== "undefined") {
        globalThis.settingsController.update(${JSON.stringify(
          this.previousSettings
        )}) 
      }
    `);
  };

  setSettings = async (settings?: Partial<Settings>) => {
    if (settings) {
      this.previousSettings = settings;
    } else {
      if (this.previousSettings) {
        settings = this.previousSettings;
      } else {
        return;
      }
    }
    await this.doAsync(`
      if (typeof globalThis.settingsController !== "undefined") {
        globalThis.settingsController.update(${JSON.stringify(settings)}) 
      }
    `);
  };

  setTags = async (note: Note | null | undefined) => {
    if (!note) return;
    const tabId = useTabStore.getState().getTabForNote(note.id);

    const tags = await db.relations.to(note, "tag").resolve();
    await this.doAsync(
      `
    const tags = editorTags[${tabId}];
    if (tags && tags.current) {
      tags.current.setTags(${JSON.stringify(
        tags.map((tag) => ({
          title: tag.title,
          alias: tag.title,
          id: tag.id,
          type: tag.type
        }))
      )});
    }
  `,
      "setTags"
    );
  };

  clearTags = async (tabId: number) => {
    await this.doAsync(
      `
    const tags = editorTags[${tabId}];
    logger("info", Object.keys(editorTags), typeof editorTags[0]);
    if (tags && tags.current) {
      tags.current.setTags([]);
    }
  `,
      "clearTags"
    );
  };

  insertAttachment = async (attachment: Attachment, tabId: number) => {
    await this.doAsync(
      `const editor = editors[${tabId}];
editor && editor.commands.insertAttachment(${JSON.stringify(attachment)})`
    );
  };

  setAttachmentProgress = async (
    attachmentProgress: Partial<Attachment>,
    tabId: number
  ) => {
    await this.doAsync(
      `const editor = editors[${tabId}];
editor && editor.commands.updateAttachment(${JSON.stringify(
        attachmentProgress
      )}, {
        preventUpdate: true,
        query: (attachment) => {
          return attachment.hash === "${attachmentProgress.hash}";
        }
      })`
    );
  };

  insertImage = async (
    image: Omit<ImageAttributes, "bloburl"> & {
      dataurl: string;
    },
    tabId: number
  ) => {
    await this.doAsync(
      `const editor = editors[${tabId}];

const image = toBlobURL("${image.dataurl}", "${image.hash}");

editor && editor.commands.insertImage({
        ...${JSON.stringify({
          ...image,
          dataurl: undefined
        })},
        bloburl: image
      })`
    );
  };

  handleBack = async () => {
    return this.doAsync<boolean>(
      'response = window.dispatchEvent(new Event("handleBackPress",{cancelable:true}));'
    );
  };

  keyboardShown = async (keyboardShown: boolean) => {
    return this.doAsync(`globalThis['keyboardShown']=${keyboardShown};`);
  };

  getTableOfContents = async () => {
    const tabId = useTabStore.getState().currentTab;
    return this.doAsync(`
      response = editorControllers[${tabId}]?.getTableOfContents() || [];
    `);
  };

  focusPassInput = async () => {
    const tabId = useTabStore.getState().currentTab;
    return this.doAsync(`
      response = editorControllers[${tabId}]?.focusPassInput() || [];
    `);
  };

  blurPassInput = async () => {
    const tabId = useTabStore.getState().currentTab;
    return this.doAsync(`
      response = editorControllers[${tabId}]?.blurPassInput() || [];
    `);
  };

  createInternalLink = async (
    attributes: LinkAttributes,
    resolverId: string
  ) => {
    if (!resolverId) return;
    return this.doAsync(`
    if (globalThis.pendingResolvers["${resolverId}"]) {
      globalThis.pendingResolvers["${resolverId}"](${JSON.stringify(
      attributes
    )});
    }`);
  };

  dismissCreateInternalLinkRequest = async (resolverId: string) => {
    if (!resolverId) return;
    return this.doAsync(`
    if (globalThis.pendingResolvers["${resolverId}"]) {
      globalThis.pendingResolvers["${resolverId}"](undefined);
    }
    `);
  };

  scrollIntoViewById = async (id: string) => {
    const tabId = useTabStore.getState().currentTab;
    return this.doAsync(`
      response = editorControllers[${tabId}]?.scrollIntoView("${id}") || [];
    `);
  };
  //todo add replace image function
}

export default Commands;
