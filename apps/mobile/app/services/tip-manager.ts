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

import { useEffect, useRef, useState } from "react";
import { MMKV } from "../common/database/mmkv";
import { strings } from "@notesnook/intl";

declare global {
  interface Array<T> {
    sample(): T;
  }
}

Array.prototype.sample = function () {
  return this[Math.floor(Math.random() * this.length)];
};

export type TipButton = {
  title: string;
  type?: string;
  action: string;
  icon?: string;
};
type Context =
  | "list"
  | "notes"
  | "notebooks"
  | "notebook"
  | "tags"
  | "open-editor"
  | "exit-editor"
  | "sidemenu"
  | "properties"
  | "first-note"
  | "first-editor-launch"
  | "monographs"
  | "trash"
  | "topics";

export type TTip = {
  text: () => string;
  contexts: Context[];
  image?: string;
  button?: TipButton;
};

export type Popup = {
  id: string;
  text: () => string;
};

const destructiveContexts = ["first-note"];

let tipState: { [name: string]: boolean } = {};
let popState: { [name: string]: boolean } = {};

export class TipManager {
  static init() {
    const tipStateJson = MMKV.getString("tipState");
    if (tipStateJson) {
      tipState = JSON.parse(tipStateJson);
    } else {
      tipState = {};
    }

    const popStateJson = MMKV.getString("popupState");
    if (popStateJson) {
      popState = JSON.parse(popStateJson);
    } else {
      popState = {};
    }
  }

  static tip(context: Context) {
    if (destructiveContexts.indexOf(context) > -1) {
      if (tipState[context]) return;
      tipState[context] = true;
      MMKV.setString("tipState", JSON.stringify(tipState));
    }

    const tipsForCtx = tips.filter((tip) => tip.contexts.indexOf(context) > -1);
    return tipsForCtx.sample();
  }

  static popup(id: string) {
    const pop = popups.find((p) => p.id === id);

    return pop;
  }

  static markPopupUsed(id: string) {
    popState[id] = true;
    MMKV.setString("popupState", JSON.stringify(popState));
  }

  static placeholderTip() {
    return placeholderTips.sample();
  }
}

export const useTip = (
  context: Context,
  fallback: Context,
  options?: {
    rotate: boolean;
    delay: number;
  }
) => {
  const [tip, setTip] = useState(
    TipManager.tip(context) || TipManager.tip(fallback)
  );
  const intervalRef = useRef<number>(0);

  useEffect(() => {
    setTip(TipManager.tip(context) || TipManager.tip(fallback));

    if (options?.rotate) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setTip(TipManager.tip(context) || TipManager.tip(fallback));
      }, options.delay || 5000) as unknown as number;
    }
    return () => {
      clearInterval(intervalRef.current);
    };
  }, [context, fallback, options?.delay, options?.rotate]);

  return tip;
};

const tips: TTip[] = strings.tips as TTip[];

const popups: Popup[] = strings.popups;

const placeholderTips = [
  "Want to remember something? Pin an important note in notifications.",
  "Privacy is power. What people don't know they cant ruin",
  "If you read someone else's diary, you get what you deserve. - David Sedaris",
  "Take quick notes from notifications. Enable the option in Settings to try",
  "Get Notesnook on all your devices. Or even open it in browser by going to https://app.notesnook.com to access all your notes",
  "With note history, you can restore back to an older version of the note if you accidentally deleted something.",
  "When your heart speaks, take good notes. - Judith Campbell",
  "You can publish a note and share it with anyone. Even if they don't use Notesnook!",
  "Published notes can be encrypted. Which means only you and the person you share the password with can read them.",
  "You can change default font size from editor settings at the end of toolbar",
  "The editor toolbar can be scrolled horizontally to add more formats and blocks",
  "To be left alone is the most precious thing one can ask of the modern world. - Anthony Burgess",
  "Arguing that you don't care about the right to privacy because you have nothing to hide is no different than saying you don't care about free speech because you have nothing to say.” ― Edward Snowden ",
  "Privacy is not something that I'm merely entitled to, it's an absolute prerequisite.” ― Marlon Brando ",
  "You can disable syncing on notes you don't want to be synced or stored anywhere other than your phone.",
  "We value your feedback so join us on Discord/Telegram and share your experiences and ideas. Let's build the best (and private) note taking app together.",
  "You can view & restore older versions of a note if you delete something accidentally by going to Note properties -> History"
];
