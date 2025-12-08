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

import { Plugin, PluginKey } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Extension } from "@tiptap/core";

export type StateChangeHandler = (fromPos: number, toPos: number) => void;

export class ReactNodeViewState {
  private changeHandlers: StateChangeHandler[] = [];

  constructor() {
    this.changeHandlers = [];
  }

  subscribe(cb: StateChangeHandler) {
    this.changeHandlers.push(cb);
  }

  unsubscribe(cb: StateChangeHandler) {
    this.changeHandlers = this.changeHandlers.filter((ch) => ch !== cb);
  }

  notifyNewSelection(fromPos: number, toPos: number) {
    this.changeHandlers.forEach((cb) => cb(fromPos, toPos));
  }
}

export const stateKey = new PluginKey("reactNodeView");

export const NodeViewSelectionNotifierPlugin = new Plugin({
  state: {
    init() {
      return new ReactNodeViewState();
    },
    apply(_tr, pluginState: ReactNodeViewState) {
      return pluginState;
    }
  },
  key: stateKey,
  view: (view: EditorView) => {
    const pluginState: ReactNodeViewState = stateKey.getState(view.state);

    return {
      update: (view: EditorView) => {
        const { from, to } = view.state.selection;
        pluginState.notifyNewSelection(from, to);
      }
    };
  }
});

export const NodeViewSelectionNotifier = Extension.create({
  name: "node-view-selection-notifier",
  addProseMirrorPlugins() {
    return [NodeViewSelectionNotifierPlugin];
  }
});
