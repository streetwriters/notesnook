/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

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
import { getAttributes } from "@tiptap/core";
import { MarkType } from "prosemirror-model";
import { Plugin, PluginKey } from "prosemirror-state";

type ClickHandlerOptions = {
  type: MarkType;
};

export function clickHandler(options: ClickHandlerOptions): Plugin {
  return new Plugin({
    key: new PluginKey("handleClickLink"),
    props: {
      handleClick: (view, pos, event) => {
        if (event.button == 2) return;
        const attrs = getAttributes(view.state, options.type.name);
        const link = (event.target as HTMLElement)?.closest("a");

        if (link && attrs.href) {
          window.open(attrs.href, attrs.target);

          return true;
        }

        return false;
      }
    }
  });
}
