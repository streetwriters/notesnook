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

import type { Attachment } from "@notesnook/editor/dist/extensions/attachment/index";
import type { ImageAttributes } from "@notesnook/editor/dist/extensions/image/index";
import { createRef, RefObject } from "react";
import { Platform } from "react-native";
import { EdgeInsets } from "react-native-safe-area-context";
import WebView from "react-native-webview";
import { db } from "../../../common/database";
import { sleep } from "../../../utils/time";
import { NoteType } from "../../../utils/types";
import { Settings } from "./types";
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

const fn = (fn: string) => {
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
        if (DEV_MODE && typeof logger !== "undefined") logger('error', "webview: ", e.message, e.stack);
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

  async doAsync<T>(job: string) {
    if (!this.ref.current) return false;
    return call(this.ref, fn(job)) as Promise<T>;
  }

  focus = async () => {
    if (!this.ref.current) return;
    if (Platform.OS === "android") {
      //this.ref.current?.requestFocus();
      setTimeout(async () => {
        if (!this.ref) return;
        textInput.current?.focus();
        await this.doAsync("editor.commands.focus()");
        this.ref?.current?.requestFocus();
      }, 1);
    } else {
      await sleep(400);
      await this.doAsync("editor.commands.focus()");
    }
  };

  blur = async () =>
    await this.doAsync(`
  editor && editor.commands.blur();
  typeof globalThis.editorTitle !== "undefined" && editorTitle.current && editorTitle.current.blur();
  `);

  clearContent = async () => {
    this.previousSettings = null;
    await this.doAsync(
      `editor.commands.blur();
typeof globalThis.editorTitle !== "undefined" && editorTitle.current && editorTitle.current?.blur();
if (editorController.content) editorController.content.current = null;
editorController.onUpdate();
editorController.setTitle(null);
editorController.countWords(0);
typeof globalThis.statusBar !== "undefined" && statusBar.current.set({date:"",saved:""});
        `
    );
  };

  setSessionId = async (id: string | null) =>
    await this.doAsync(`globalThis.sessionId = "${id}";`);

  setStatus = async (date: string | undefined, saved: string) =>
    await this.doAsync(
      `typeof globalThis.statusBar !== "undefined" && statusBar.current.set({date:"${date}",saved:"${saved}"})`
    );

  setPlaceholder = async (placeholder: string) => {
    await this.doAsync(`
    const element = document.querySelector(".is-editor-empty");
    if (element) {
      element.setAttribute("data-placeholder","${placeholder}");
    }
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

  setTags = async (note: NoteType | null | undefined) => {
    if (!note) return;
    const tags = !note.tags
      ? []
      : note.tags
          .map((t: string) =>
            db.tags?.tag(t)
              ? { title: db.tags.tag(t).title, alias: db.tags.tag(t).alias }
              : null
          )
          .filter((t) => t !== null);
    await this.doAsync(`
    if (typeof editorTags !== "undefined" && editorTags.current) {
      editorTags.current.setTags(${JSON.stringify(tags)});
    }
  `);
  };

  clearTags = async () => {
    await this.doAsync(`
    if (typeof editorTags !== "undefined" && editorTags.current) {
      editorTags.current.setTags([]);
    }
  `);
  };

  insertAttachment = async (attachment: Attachment) => {
    await this.doAsync(
      `editor && editor.commands.insertAttachment(${JSON.stringify(
        attachment
      )})`
    );
  };

  setAttachmentProgress = async (attachmentProgress: Partial<Attachment>) => {
    await this.doAsync(
      `editor && editor.commands.updateAttachment(${JSON.stringify(
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
    }
  ) => {
    await this.doAsync(
      `const image = toBlobURL("${image.dataurl}", "${image.hash}");
      editor && editor.commands.insertImage({
        ...${JSON.stringify({
          ...image,
          dataurl: undefined
        })},
        bloburl: image
      })`
    );
  };

  updateWebclip = async ({ src, hash }: Partial<ImageAttributes>) => {
    await this.doAsync(
      `editor && editor.commands.updateWebClip(${JSON.stringify({
        hash
      })},${JSON.stringify({ src })})`
    );
  };

  updateImage = async ({
    hash,
    dataurl
  }: Partial<Omit<ImageAttributes, "bloburl">> & {
    dataurl: string;
  }) => {
    await this.doAsync(
      `const image = toBlobURL("${dataurl}", "${hash}");
      editor && editor.commands.updateImage(${JSON.stringify({
        hash
      })}, {
        ...${JSON.stringify({ hash, preventUpdate: true })},
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
  //todo add replace image function
}

export default Commands;
