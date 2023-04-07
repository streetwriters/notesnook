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

import { Dimensions, NativeModules, Platform } from "react-native";
import {
  beginBackgroundTask,
  endBackgroundTask
} from "react-native-begin-background-task";
import RNTooltips from "react-native-tooltips";
import { db } from "../common/database";
import { tabBarRef } from "./global-refs";

let prevTarget = null;
let htmlToText;

export const TOOLTIP_POSITIONS = {
  LEFT: 1,
  RIGHT: 2,
  TOP: 3,
  BOTTOM: 4
};

export const sortSettings = {
  sort: "default",
  /**
   * @type {"desc" | "asc"}
   */
  sortOrder: "desc"
};

export const editing = {
  currentlyEditing: false,
  isFullscreen: false,
  actionAfterFirstSave: {
    type: null
  },
  isFocused: false,
  focusType: null,
  movedAway: true,
  tooltip: false,
  isRestoringState: false
};
export const selection = {
  data: [],
  type: null,
  selectedItems: []
};

export const history = {
  selectedItemsList: [],
  selectionMode: false
};

export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export const AndroidModule = NativeModules.NNativeModule;

export let dWidth = Dimensions.get("window").width;
export let dHeight = Dimensions.get("window").height;

export const InteractionManager = {
  runAfterInteractions: (func, time = 300) => setTimeout(func, time)
};

export function getElevation(elevation) {
  return {
    elevation,
    shadowColor: "black",
    shadowOffset: { width: 0.3 * elevation, height: 0.5 * elevation },
    shadowOpacity: 0.2,
    shadowRadius: 0.7 * elevation
  };
}

export async function doInBackground(cb) {
  if (Platform.OS === "ios") {
    let bgTaskId;
    try {
      bgTaskId = await beginBackgroundTask();
      let res = await cb();
      await endBackgroundTask(bgTaskId);
      return res;
    } catch (e) {
      return e.message;
    }
  } else {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (res) => {
      try {
        let result = await cb();
        res(result);
      } catch (e) {
        res(e.message);
      }
    });
  }
}

export function nth(n) {
  return (
    ["st", "nd", "rd"][(((((n < 0 ? -n : n) + 90) % 100) - 10) % 10) - 1] ||
    "th"
  );
}

export function setWidthHeight(size) {
  dWidth = size.width;
  dHeight = size.height;
}

export function getTotalNotes(item) {
  if (!item || (item.type !== "notebook" && item.type !== "topic")) return 0;
  if (item.type === "topic") {
    return (
      db.notebooks.notebook(item.notebookId)?.topics.topic(item.id)
        ?.totalNotes || 0
    );
  }
  return db.notebooks.notebook(item.id)?.totalNotes || 0;
}

export async function toTXT(note, template = true) {
  let text;
  if (note.locked) {
    text = await db.notes.note(note.id).export("txt", note.content, template);
  } else {
    text = await db.notes.note(note.id).export("txt", undefined, template);
  }
  return text;
}

export function showTooltip(event, text, position = 2) {
  if (!event._targetInst?.ref?.current) return;
  prevTarget && RNTooltips.Dismiss(prevTarget);
  prevTarget = null;
  prevTarget = event._targetInst.ref.current;
  RNTooltips.Show(prevTarget, tabBarRef.current?.node?.current, {
    text: text,
    tintColor: "#000000",
    corner: Platform.OS === "ios" ? 5 : 40,
    textSize: 14,
    position: position,
    duration: 1000,
    autoHide: true,
    clickToHide: true
  });
}
