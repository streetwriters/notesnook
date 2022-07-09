import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";

const key = new PluginKey("selection-persist-key");
export const SelectionPersist = Extension.create({
  name: "selection-persist",

  addProseMirrorPlugins() {
    let isFocused = false;
    let isBlurred = false;
    return [
      new Plugin({
        key,
        props: {
          decorations(state) {
            return key.getState(state);
          },
        },
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, value, oldState, newState) {
            // isBlurred should remain true until isFocused becomes true
            // isFocused should remain true until isBlurred becomes true

            const _isBlurred = !!tr.getMeta("blur");
            const _isFocused = !!tr.getMeta("focus");

            if (_isFocused) {
              isBlurred = false;
              isFocused = true;
            }

            if (_isBlurred) {
              isBlurred = true;
              isFocused = false;
            }

            const { from, to } = oldState.selection;
            if (isBlurred) {
              return DecorationSet.create(tr.doc, [
                Decoration.inline(from, to, {
                  style: `background-color: var(--dimPrimary)`,
                }),
              ]);
            } else if (isFocused) {
              return DecorationSet.empty;
            }
            return DecorationSet.empty;
          },
        },
      }),
    ];
  },
});
