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

import { strings } from "@notesnook/intl";
import { getFontConfig } from "@notesnook/theme";
import Config from "../../utils/config";

export const EDITOR_LINE_HEIGHT = {
  DEFAULT: 1.2,
  MAX: 10,
  MIN: 1
};

const EDITOR_ZOOM_DEFAULT = 100;

export type EditorConfig = {
  fontFamily: string;
  fontSize: number;
  zoom: number;
  lineHeight: number;
};

type Listener = (config: EditorConfig, previous: EditorConfig) => void;

let current: EditorConfig = Config.get("editorConfig", {
  fontFamily: "sans-serif",
  fontSize: 14,
  zoom: EDITOR_ZOOM_DEFAULT,
  lineHeight: EDITOR_LINE_HEIGHT.DEFAULT
});
const listeners = new Set<Listener>();

export const editorConfig = () => current;

export function setEditorConfig(config: Partial<EditorConfig>) {
  const previous = current;
  current = Config.set("editorConfig", { ...current, ...config });
  listeners.forEach((listener) => listener(current, previous));
}

export function onEditorConfigChange(
  selector: (editorConfig: EditorConfig) => unknown,
  listener: (config: EditorConfig, previous: EditorConfig) => void
) {
  const wrapped: Listener = (next, previous) => {
    if (selector(next) !== selector(previous)) listener(next, previous);
  };
  listeners.add(wrapped);
  return () => {
    listeners.delete(wrapped);
  };
}

export function getFonts() {
  return [
    {
      title: strings.monospace(),
      id: "monospace",
      font: getFontConfig().fonts.monospace
    },
    {
      title: strings.sansSerif(),
      id: "sans-serif",
      font: getFontConfig().fonts.body
    },
    {
      title: strings.serif(),
      id: "serif",
      font: `Noto Serif, Times New Roman, serif`
    }
  ];
}
