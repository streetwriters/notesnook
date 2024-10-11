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
  | "attachments";

export type Tip = {
  text: string;
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

    const tipsForCtx = tips.filter((tip) => tip.contexts.indexOf(context) > -1);
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
  const defaultTip = DEFAULT_TIPS[context];

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

  if (tip && defaultTip) {
    return { ...tip, button: defaultTip.button };
  } else return tip || defaultTip;
};

const tips: Tip[] = [
  {
    text: "Hold Ctrl/Cmd & click on multiple items to select them.",
    contexts: ["notes", "notebooks", "tags"]
  },
  {
    text: "Monographs enable you to share your notes in a secure and private way.",
    contexts: ["monographs"]
  },
  {
    text: "Monographs can be encrypted with a secret key and shared with anyone.",
    contexts: ["monographs"]
  },
  {
    text: "Published notes can be encrypted. Which means only you and the person you share the password with can read them.",
    contexts: ["monographs"]
  },
  {
    text: "You can pin frequently used Notebooks to the Side Menu to quickly access them.",
    contexts: ["notebooks", "notebooks"]
  },
  {
    text: "A notebook can have unlimited sub-notebooks with unlimited notes.",
    contexts: ["notebooks"]
  },
  {
    text: "You can multi-select notes and move them to a notebook or a sub-notebook at once.",
    contexts: ["notebooks"]
  },
  {
    text: "Mark important notes by adding them to favorites.",
    contexts: ["notes", "favorites"]
  },
  {
    text: "Are you scrolling a lot to find a specific note? Pin it to the top from Note properties.",
    contexts: ["notes"]
  },
  {
    text: "Pin your most important Notebooks to the top from Notebook properties.",
    contexts: ["notebooks"]
  },
  {
    text: "We value your feedback so join us on Discord and share your experiences and ideas.",
    contexts: ["notes", "notebooks", "tags"],
    button: {
      title: strings.joinCommunity(),
      icon: ArrowTopRight,
      onClick: () =>
        window.open("https://discord.gg/notesnook-796015620436787241", "_blank")
    }
  },
  {
    text: "You can adjust how long items live in your trash from Settings -> Trash settings.",
    contexts: ["trash"]
  }
];

const DEFAULT_TIPS: Record<TipContext, Omit<Tip, "contexts">> = {
  attachments: {
    text: "You have no attachments."
  },
  favorites: { text: "Notes you favorite will appear here." },
  monographs: {
    text: "You haven't published any notes yet.",
    button: {
      title: "What are monographs?",
      icon: ArrowTopRight,
      onClick() {
        window.open(
          "https://help.notesnook.com/publish-notes-with-monographs",
          "_blank"
        );
      }
    }
  },
  notebooks: {
    text: "You haven't created any notebooks.",
    button: { ...CREATE_BUTTON_MAP.notebooks, icon: Plus }
  },
  notes: {
    text: "You have not created any notes yet.",
    button: {
      ...CREATE_BUTTON_MAP.notes,
      icon: Plus
    }
  },
  reminders: {
    text: "You can set daily, weekly or monthly reminders & stay ahead of your tasks.",
    button: { ...CREATE_BUTTON_MAP.reminders, icon: Plus }
  },
  tags: {
    text: "You can use #tags to organize your notes.",
    button: {
      ...CREATE_BUTTON_MAP.tags,
      icon: Plus
    }
  },
  trash: {
    text: ""
  },
  search: { text: "" }
};
