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
import { CREATE_BUTTON_MAP } from "../common";
import { ArrowTopRight, Icon, Plus } from "../components/icons";
import Config from "../utils/config";
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
  onClick: () => void;
  icon?: Icon;
};
export type TipContext =
  | "notes"
  | "notebooks"
  | "tags"
  | "search"
  | "favorites"
  | "reminders"
  | "monographs"
  | "trash"
  | "archive"
  | "attachments";

export type Tip = {
  text: () => string;
  contexts: TipContext[];
  button?: TipButton;
};

const destructiveContexts: string[] = [];

let tipState: Partial<Record<TipContext, boolean>> | undefined = undefined;

export class TipManager {
  static init() {}

  static tip(context: TipContext) {
    if (!tipState) tipState = Config.get("tipState", {});

    if (destructiveContexts.indexOf(context) > -1) {
      if (tipState[context]) return;
      tipState[context] = true;
      Config.set("tipState", tipState);
    }

    const tipsForCtx = getTips().filter((tip) => tip.contexts.indexOf(context) > -1);
    return tipsForCtx.sample();
  }
}

export const useTip = (
  context: TipContext,
  options?: {
    rotate: boolean;
    delay: number;
  }
) => {
  const [tip, setTip] = useState(TipManager.tip(context));
  const intervalRef = useRef<number>(0);
  const defaultTip = getDefaultTips()[context];

  useEffect(() => {
    setTip(TipManager.tip(context));

    if (options?.rotate) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setTip(TipManager.tip(context));
      }, options.delay || 5000) as unknown as number;
    }
    return () => {
      clearInterval(intervalRef.current);
    };
  }, [context, options?.delay, options?.rotate]);

  const activeTip = tip || defaultTip;
  if (!activeTip) return null;

  const text =
    typeof activeTip.text === "function" ? activeTip.text() : activeTip.text;
  const button = defaultTip?.button || tip?.button;

  return { text, button };
};

const getTips = (): Tip[] => (strings.webTips as unknown as Tip[]) || [];

const getDefaultTips = (): Record<
  TipContext,
  { text: () => string; button?: TipButton }
> => ({
  attachments: {
    text: () => strings.noAttachments()
  },
  favorites: { text: () => strings.favoritesEmpty() },
  monographs: {
    text: () => strings.monographsEmpty(),
    button: {
      title: strings.whatAreMonographs(),
      icon: ArrowTopRight,
      onClick() {
        window.open(
          "https://notesnook.com/help/publish-notes-with-monographs",
          "_blank"
        );
      }
    }
  },
  notebooks: {
    text: () => strings.notebooksEmpty(),
    button: { ...CREATE_BUTTON_MAP.notebooks, icon: Plus }
  },
  notes: {
    text: () => strings.notesEmpty(),
    button: {
      ...CREATE_BUTTON_MAP.notes,
      icon: Plus
    }
  },
  reminders: {
    text: () => strings.remindersEmpty(),
    button: { ...CREATE_BUTTON_MAP.reminders, icon: Plus }
  },
  tags: {
    text: () => strings.tagsEmpty(),
    button: {
      ...CREATE_BUTTON_MAP.tags,
      icon: Plus
    }
  },
  trash: {
    text: () => ""
  },
  archive: {
    text: () => strings.yourArchiveIsEmpty()
  },
  search: { text: () => "" }
});
