"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeViewSelectionNotifier = exports.NodeViewSelectionNotifierPlugin = exports.stateKey = exports.ReactNodeViewState = void 0;
const prosemirror_state_1 = require("prosemirror-state");
const core_1 = require("@tiptap/core");
class ReactNodeViewState {
    constructor() {
        this.changeHandlers = [];
        this.changeHandlers = [];
    }
    subscribe(cb) {
        this.changeHandlers.push(cb);
    }
    unsubscribe(cb) {
        this.changeHandlers = this.changeHandlers.filter((ch) => ch !== cb);
    }
    notifyNewSelection(fromPos, toPos) {
        this.changeHandlers.forEach((cb) => cb(fromPos, toPos));
    }
}
exports.ReactNodeViewState = ReactNodeViewState;
exports.stateKey = new prosemirror_state_1.PluginKey("reactNodeView");
exports.NodeViewSelectionNotifierPlugin = new prosemirror_state_1.Plugin({
    state: {
        init() {
            return new ReactNodeViewState();
        },
        apply(_tr, pluginState) {
            return pluginState;
        },
    },
    key: exports.stateKey,
    view: (view) => {
        const pluginState = exports.stateKey.getState(view.state);
        return {
            update: (view) => {
                const { from, to } = view.state.selection;
                pluginState.notifyNewSelection(from, to);
            },
        };
    },
});
exports.NodeViewSelectionNotifier = core_1.Extension.create({
    addProseMirrorPlugins() {
        return [exports.NodeViewSelectionNotifierPlugin];
    },
});
