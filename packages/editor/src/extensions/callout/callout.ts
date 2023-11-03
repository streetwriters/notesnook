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
import { Node, wrappingInputRule } from "@tiptap/core";
import { createNodeView } from "../react";
import { CalloutComponenet } from "./component";

const CALLOUT_REGEX = /\{:\s\.[A-Za-z-]+\s\}/g;

export const Callout = Node.create({
  name: "callouts",
  content: "block*",
  group: "block",
  defining: true,

  addAttributes() {
    return {
      titleText: {
        default: null,
        parseHTML: (element) => element.getAttribute("titleText"),
        rendered: false
      },
      color: {
        default: null,
        parseHTML: (element) => element.getAttribute("color"),
        rendered: false
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: "div"
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", HTMLAttributes, 0];
  },

  addInputRules() {
    return [
      wrappingInputRule({
        //ask why is it here in the first place?
        find: CALLOUT_REGEX,
        type: this.type,
        getAttributes(match) {
          let [callout] = match;
          callout = callout.replace(/[{}:\s.]/g, "");
          return calloutParser(callout);
        }
      })
    ];
  },

  addNodeView() {
    return createNodeView(CalloutComponenet, {
      contentDOMFactory: () => {
        const content = document.createElement("div");
        content.classList.add("node-content-wrapper");
        return { dom: content };
      }
    });
  }
});

function calloutParser(callout: string): {
  color?: string | null;
  titleText?: string | null;
} {
  switch (callout) {
    case "highlight":
      return { color: "rgba(255, 235, 130", titleText: "" };
    case "warning":
      return { color: "rgba(247, 126, 126", titleText: "WARNING" };
    case "note":
      return { color: "rgba(114, 83, 237", titleText: "NOTE" };
    case "important":
      return {
        color: "rgba(44, 132, 250",
        titleText: "IMPORTANT"
      };
    case "new":
      return { color: "rgba(65, 214, 147", titleText: "NEW" };
    default:
      return {
        color: "rgba(114, 83, 237",
        titleText: callout.toUpperCase()
      };
  }
}
