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

import { mergeAttributes, wrappingInputRule } from "@tiptap/core";
import { TaskList } from "@tiptap/extension-task-list";
import { createNodeView } from "../react";
import { TaskListComponent } from "./component";
import { Plugin, PluginKey, NodeSelection } from "prosemirror-state";
import TaskItem, { inputRegex } from "@tiptap/extension-task-item";
import { dropPoint } from "prosemirror-transform";
import {
  findChildrenByType,
  getParentAttributes,
  hasSameAttributes
} from "../../utils/prosemirror";
import { countCheckedItems } from "./utils";

export type TaskListAttributes = {
  title: string;
  readonly: boolean;
};

const stateKey = new PluginKey("task-item-drop-override");
export const TaskListNode = TaskList.extend({
  addAttributes() {
    return {
      title: {
        default: null,
        keepOnSplit: false,
        parseHTML: (element) => element.dataset.title,
        renderHTML: (attributes) => {
          if (!attributes.title || attributes.nested) {
            return {};
          }

          return {
            "data-title": attributes.title
          };
        }
      },
      readonly: {
        default: false,
        keepOnSplit: false,
        parseHTML: (element) => element.dataset.readonly,
        renderHTML: (attributes) => {
          if (!attributes.readonly) {
            return {};
          }
          return {
            "data-readonly": attributes.readonly
          };
        }
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: "ul",
        getAttrs: (node) => {
          if (node instanceof Node && node instanceof HTMLElement) {
            return node.classList.contains("checklist") && null;
          }
          return false;
        },
        priority: 51
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "ul",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: "checklist"
      }),
      0
    ];
  },

  addCommands() {
    return {
      toggleTaskList:
        () =>
        ({ editor, chain, state, tr }) => {
          const { $from, $to } = state.selection;

          chain()
            .toggleList(
              this.name,
              this.options.itemTypeName,
              true,
              getParentAttributes(this.editor, true, true)
            )
            .run();

          const position = {
            from: tr.mapping.map($from.pos),
            to: tr.mapping.map($to.pos)
          };
          // There is a minor bug in Prosemirror or Tiptap where creating
          // nested node view causes the editor selection to act weird.
          // The solution is to manually force the editor back to the correct
          // position.
          // NOTE: We have to wrap this in setTimeout & use the editor
          // directly or else it won't run.
          setTimeout(() => editor.commands.setTextSelection(position), 0);
          return true;
        }
    };
  },

  addNodeView() {
    return createNodeView(TaskListComponent, {
      contentDOMFactory: () => {
        const content = document.createElement("ul");
        content.classList.add(`${this.name.toLowerCase()}-content-wrapper`);
        content.style.whiteSpace = "inherit";
        return { dom: content };
      },
      shouldUpdate: (prev, next) => {
        return (
          !hasSameAttributes(prev.attrs, next.attrs) ||
          prev.childCount !== next.childCount ||
          countCheckedItems(prev).checked !== countCheckedItems(next).checked
        );
      }
    });
  },
  addProseMirrorPlugins() {
    const thisType = this.type;
    return [
      new Plugin({
        key: stateKey,
        props: {
          // This overrides the default task item drop behavior to make dropping
          // items at the very end of the task list more reliable.
          // Currently, dropping the item at the end of the list creates a
          // new list which is often not what you want. We look for such
          // behavior and instead moves the item to the very end.
          handleDrop(view, event, slice, moved) {
            const isTaskItem =
              slice.content.firstChild?.type.name === TaskItem.name;
            if (isTaskItem) {
              const eventPos = view.posAtCoords(eventCoords(event));
              if (!eventPos) return;
              const $mouse = view.state.doc.resolve(eventPos.pos);

              let insertPos = slice
                ? dropPoint(view.state.doc, $mouse.pos, slice)
                : $mouse.pos;
              if (insertPos == null) insertPos = $mouse.pos;

              const taskLists = findChildrenByType(
                view.state.doc,
                thisType,
                false
              );

              // we iterate over all the first level task lists and see if
              // the drop point is at the end of any of the task lists.
              // TODO: this can get slow if there are a lot of task lists.
              // We should loook for an alternative way to detect exactly
              // which task list the user wants to drop the item into.
              for (const taskList of taskLists) {
                const range = {
                  from: taskList.pos,
                  to: taskList.pos + taskList.node.nodeSize
                };
                const isDroppedAtEnd = range.to === insertPos;
                if (isDroppedAtEnd) {
                  // This logic is taken from https://github.com/ProseMirror/prosemirror-view/blob/c47178ce2d5726f07a21d0759b3350ee1d185fd5/src/input.ts#L685
                  const tr = view.state.tr;
                  if (moved) tr.deleteSelection();
                  const pos = tr.mapping.map(insertPos - 1);
                  const beforeInsert = tr.doc;

                  tr.replaceRangeWith(pos, pos, slice.content.firstChild);
                  if (tr.doc.eq(beforeInsert)) return;

                  const $pos = tr.doc.resolve(pos);
                  tr.setSelection(new NodeSelection($pos));

                  view.focus();
                  view.dispatch(tr.setMeta("uiEvent", "drop"));
                  return true;
                }
              }
            }
            return false;
          }
        }
      })
    ];
  },

  addInputRules() {
    const inputRule = wrappingInputRule({
      find: inputRegex,
      type: this.type,
      getAttributes: () => {
        return getParentAttributes(this.editor, true, true);
      }
    });
    const oldHandler = inputRule.handler;
    inputRule.handler = ({ state, range, match, chain, can, commands }) => {
      oldHandler({ state, range, match, chain, can, commands });

      state.tr.setNodeMarkup(state.tr.selection.to - 2, undefined, {
        checked: match[match.length - 1] === "x"
      });
    };
    return [inputRule];
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Shift-T": () => this.editor.commands.toggleTaskList()
    };
  }
});

function eventCoords(event: MouseEvent) {
  return { left: event.clientX, top: event.clientY };
}
