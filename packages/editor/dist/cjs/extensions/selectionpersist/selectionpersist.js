"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelectionPersist = void 0;
const core_1 = require("@tiptap/core");
const prosemirror_state_1 = require("prosemirror-state");
const prosemirror_view_1 = require("prosemirror-view");
const key = new prosemirror_state_1.PluginKey("selection-persist-key");
exports.SelectionPersist = core_1.Extension.create({
    name: "selection-persist",
    addProseMirrorPlugins() {
        let isFocused = false;
        let isBlurred = false;
        return [
            new prosemirror_state_1.Plugin({
                key,
                props: {
                    decorations(state) {
                        return key.getState(state);
                    },
                },
                state: {
                    init() {
                        return prosemirror_view_1.DecorationSet.empty;
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
                            return prosemirror_view_1.DecorationSet.create(tr.doc, [
                                prosemirror_view_1.Decoration.inline(from, to, {
                                    style: `background-color: var(--dimPrimary)`,
                                }),
                            ]);
                        }
                        else if (isFocused) {
                            return prosemirror_view_1.DecorationSet.empty;
                        }
                        return prosemirror_view_1.DecorationSet.empty;
                    },
                },
            }),
        ];
    },
});
