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
import type {
  Attachment,
  ImageAttributes,
  LinkAttributes
} from "@notesnook/editor";
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

  async sendCommand<T>(command: string, ...args: any[]) {
    return this.doAsync(
      `response = globalThis.commands.${command}(${args
        .map((arg) =>
          typeof arg === "string" ? `"${arg}"` : JSON.stringify(arg)
        )
        .join(",")})`,
      command
    );
  }

  focus = async (tabId: string) => {
    if (!this.ref.current) return;

    const locked = useTabStore.getState().getTab(tabId)?.session?.locked;
    if (Platform.OS === "android") {
      setTimeout(async () => {
        if (
          locked &&
          useTabStore.getState().biometryAvailable &&
          useTabStore.getState().biometryEnrolled
        )
          return;

        if (!this.ref) return;
        textInput.current?.focus();
        await this.sendCommand("focus", tabId, locked);
        this.ref?.current?.requestFocus();
      }, 1);
    } else {
      await sleep(400);
      await this.sendCommand("focus", tabId, locked);
    }
  };

  blur = async (tabId: string) => this.sendCommand("blur", tabId);

  clearContent = async (tabId: string) => {
    this.previousSettings = null;
    await this.sendCommand("clearContent", tabId);
  };

  setSessionId = async (id: string | null) =>
    await this.sendCommand("setSessionId", id);

  setStatus = async (
    date: string | undefined,
    saved: string,
    tabId: string
  ) => {
    this.sendCommand("setStatus", date, saved, tabId);
  };

  setPlaceholder = async (placeholder: string) => {};

  setLoading = async (loading?: boolean, tabId?: string) => {
    this.sendCommand(
      "setLoading",
      loading,
      tabId === undefined ? useTabStore.getState().currentTab : tabId
    );
  };

  setInsets = async (insets: EdgeInsets) => {
    this.sendCommand("setInsets", insets);
  };

  updateSettings = async (settings?: Partial<Settings>) => {
    if (!this.previousSettings) return;
    this.previousSettings = {
      ...this.previousSettings,
      ...settings
    };
    this.sendCommand("updateSettings", settings);
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
    this.sendCommand("setSettings", settings);
  };

  setTags = async (note: Note | null | undefined) => {
    if (!note) return;
    useTabStore.getState().forEachNoteTab(note.id, async (tab) => {
      const tabId = tab.id;
      const tags = await db.relations.to(note, "tag").resolve();
      await this.sendCommand("setTags", tabId, tags);
    });
  };

  clearTags = async (tabId: string) => {
    await this.sendCommand("clearTags", tabId);
  };

  insertAttachment = async (attachment: Attachment, tabId: string) => {
    await this.sendCommand("insertAttachment", attachment, tabId);
  };

  setAttachmentProgress = async (
    attachmentProgress: Partial<Attachment>,
    tabId: string
  ) => {
    await this.sendCommand("setAttachmentProgress", attachmentProgress, tabId);
  };

  insertImage = async (
    image: Omit<ImageAttributes, "bloburl"> & {
      dataurl: string;
    },
    tabId: string
  ) => {
    await this.sendCommand("insertImage", image, tabId);
  };

  handleBack = async () => {
    return this.sendCommand("handleBack");
  };

  keyboardShown = async (keyboardShown: boolean) => {
    return this.sendCommand("keyboardShown", keyboardShown);
  };

  getTableOfContents = async () => {
    const tabId = useTabStore.getState().currentTab;
    return this.sendCommand("getTableOfContents", tabId);
  };

  focusPassInput = async () => {
    const tabId = useTabStore.getState().currentTab;
    return this.sendCommand("focusPassInput", tabId);
  };

  blurPassInput = async () => {
    const tabId = useTabStore.getState().currentTab;
    return this.sendCommand("blurPassInput", tabId);
  };

  createInternalLink = async (
    attributes: LinkAttributes,
    resolverId: string
  ) => {
    if (!resolverId) return;
    return this.sendCommand("createInternalLink", attributes, resolverId);
  };

  dismissCreateInternalLinkRequest = async (resolverId: string) => {
    if (!resolverId) return;
    return this.sendCommand("dismissCreateInternalLinkRequest", resolverId);
  };

  scrollIntoViewById = async (id: string) => {
    const tabId = useTabStore.getState().currentTab;
    return this.sendCommand("scrollIntoViewById", id, tabId);
  };
}

export default Commands;
