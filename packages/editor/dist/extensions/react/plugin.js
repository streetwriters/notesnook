import { Plugin, PluginKey } from "prosemirror-state";
import { Extension } from "@tiptap/core";
var ReactNodeViewState = /** @class */ (function () {
    function ReactNodeViewState() {
        this.changeHandlers = [];
        this.changeHandlers = [];
    }
    ReactNodeViewState.prototype.subscribe = function (cb) {
        this.changeHandlers.push(cb);
    };
    ReactNodeViewState.prototype.unsubscribe = function (cb) {
        this.changeHandlers = this.changeHandlers.filter(function (ch) { return ch !== cb; });
    };
    ReactNodeViewState.prototype.notifyNewSelection = function (fromPos, toPos) {
        this.changeHandlers.forEach(function (cb) { return cb(fromPos, toPos); });
    };
    return ReactNodeViewState;
}());
export { ReactNodeViewState };
export var stateKey = new PluginKey("reactNodeView");
export var NodeViewSelectionNotifierPlugin = new Plugin({
    state: {
        init: function () {
            return new ReactNodeViewState();
        },
        apply: function (_tr, pluginState) {
            return pluginState;
        },
    },
    key: stateKey,
    view: function (view) {
        var pluginState = stateKey.getState(view.state);
        return {
            update: function (view) {
                var _a = view.state.selection, from = _a.from, to = _a.to;
                pluginState.notifyNewSelection(from, to);
            },
        };
    },
});
export var NodeViewSelectionNotifier = Extension.create({
    addProseMirrorPlugins: function () {
        return [NodeViewSelectionNotifierPlugin];
    },
});
