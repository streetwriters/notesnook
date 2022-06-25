var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx } from "react/jsx-runtime";
import TiptapLink from "@tiptap/extension-link";
import { Plugin, PluginKey } from "prosemirror-state";
import { showPopup } from "../../components/popup-presenter";
import { ToolbarGroup } from "../../toolbar/components/toolbar-group";
var linkHoverPluginKey = new PluginKey("linkHover");
export var Link = TiptapLink.extend({
    addProseMirrorPlugins: function () {
        var _this = this;
        var _a;
        var linkRef = null;
        return __spreadArray(__spreadArray([], __read((((_a = this.parent) === null || _a === void 0 ? void 0 : _a.call(this)) || [])), false), [
            new Plugin({
                key: linkHoverPluginKey,
                props: {
                    handleDOMEvents: {
                        mouseover: function (view, event) {
                            var _a;
                            if (event.target instanceof HTMLElement &&
                                ((_a = event.target) === null || _a === void 0 ? void 0 : _a.classList.contains("ProseMirror"))) {
                                return;
                            }
                            if (event.target instanceof HTMLElement &&
                                event.target.nodeName === "A") {
                                if (linkRef)
                                    return;
                                var pos_1 = view.posAtDOM(event.target, 0);
                                var node_1 = view.state.doc.nodeAt(pos_1);
                                console.log(node_1, pos_1);
                                if (!(node_1 === null || node_1 === void 0 ? void 0 : node_1.isText) ||
                                    node_1.marks.length <= 0 ||
                                    !node_1.marks.some(function (mark) { return mark.type === _this.type; }))
                                    return;
                                linkRef = showPopup({
                                    popup: function () { return (_jsx(ToolbarGroup, { force: true, tools: ["editLink", "removeLink", "openLink"], editor: _this.editor, selectedNode: {
                                            node: node_1,
                                            from: pos_1,
                                            to: pos_1 + node_1.nodeSize,
                                        }, sx: {
                                            bg: "background",
                                            boxShadow: "menu",
                                            borderRadius: "default",
                                            p: 1,
                                        } })); },
                                    theme: _this.editor.storage.theme,
                                    blocking: false,
                                    focusOnRender: false,
                                    position: {
                                        target: event.target,
                                        align: "center",
                                        location: "top",
                                        isTargetAbsolute: true,
                                    },
                                });
                            }
                            else if (linkRef) {
                                linkRef();
                                linkRef = null;
                            }
                        },
                    },
                },
            }),
        ], false);
    },
});
