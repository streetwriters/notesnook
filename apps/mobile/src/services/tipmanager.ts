import { useEffect, useRef, useState } from 'react';
import { MMKV } from '../utils/mmkv';

//@ts-ignore
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
  | 'list'
  | 'notes'
  | 'notebooks'
  | 'notebook'
  | 'tags'
  | 'open-editor'
  | 'exit-editor'
  | 'sidemenu'
  | 'properties'
  | 'first-note'
  | 'first-editor-launch'
  | 'monographs';

export type TTip = {
  text: string;
  contexts: Context[];
  image?: string;
  button?: TipButton;
};

export type Popup = {
  id: string;
  text: string;
};

const destructiveContexts = ['first-note'];

let tipState: { [name: string]: boolean } = {};
let popState: { [name: string]: boolean } = {};

export class TipManager {
  static async init() {
    let tipStateJson = await MMKV.getItem('tipState');
    if (tipStateJson) {
      tipState = JSON.parse(tipStateJson);
    } else {
      //@ts-ignore
      tipState = {};
    }

    let popStateJson = await MMKV.getItem('popupState');
    if (popStateJson) {
      popState = JSON.parse(popStateJson);
    } else {
      //@ts-ignore
      popState = {};
    }
    console.log('tipState:', tipState, 'popupState:', popState);
  }

  static tip(context: Context) {
    if (destructiveContexts.indexOf(context) > -1) {
      //@ts-ignore
      if (tipState[context]) return;
      //@ts-ignore
      tipState[context] = true;
      MMKV.setItem('tipState', JSON.stringify(tipState));
    }

    let tipsForCtx = tips.filter(tip => tip.contexts.indexOf(context) > -1);

    //@ts-ignore
    return tipsForCtx.sample();
  }

  static popup(id: string) {
    let pop = popups.find(p => p.id === id);
    //@ts-ignore
    if (popState[id]) return null;

    return pop;
  }

  static markPopupUsed(id: string) {
    //@ts-ignore
    popState[id] = true;
    MMKV.setItem('popupState', JSON.stringify(popState));
  }

  static placeholderTip() {
    //@ts-ignore
    return placeholderTips.sample();
  }
}

export const useTip = (
  context: Context,
  fallback: Context,
  options: {
    rotate: boolean;
    delay: number;
  }
) => {
  const [tip, setTip] = useState(TipManager.tip(context) || TipManager.tip(fallback));
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    setTip(TipManager.tip(context) || TipManager.tip(fallback));

    if (options?.rotate) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setTip(TipManager.tip(context) || TipManager.tip(fallback));
      }, options.delay || 5000);
    }
    return () => {
      clearInterval(intervalRef.current);
    };
  }, [context, fallback]);

  return tip;
};

const tips: TTip[] = [
  {
    text: 'You can swipe left anywhere in the app to start a new note',
    contexts: ['notes', 'first-note']
  },
  {
    text: 'Long press on any item in list to open quick actions menu.',
    contexts: ['notes', 'notebook', 'notebook', 'tags']
  },
  {
    text: 'Monographs enable you to share your notes in a secure and private way',
    contexts: ['monographs']
  },
  {
    text: 'Monographs can be encrypted with a secret key and shared with anyone',
    contexts: ['monographs']
  }
];

const popups: Popup[] = [
  {
    id: 'sortmenu',
    text: 'Tap here to change sorting'
  },
  {
    id: 'jumpto',
    text: 'Tap here to jump to a section'
  },
  {
    id: 'compactmode',
    text: 'Try compact mode to fit more items on screen'
  },
  {
    id: 'searchreplace',
    text: 'Switch to search/replace mode'
  }
];

const placeholderTips = [
  `Want to remember something? Pin an\nimportant in notifications.`,
  `Privacy is power. What people don't know they cant ruin`,
  `If you read someone else's diary, you get what you deserve. - David Sedaris`,
  'Take quick notes from notifications. Just enable the option in Settings.'
];
