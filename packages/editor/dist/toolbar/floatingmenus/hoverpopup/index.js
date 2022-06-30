"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HoverPopupHandler = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var popuppresenter_1 = require("../../../components/popuppresenter");
var link_1 = require("./link");
var handlers = __assign({}, link_1.LinkHoverPopupHandler);
var HOVER_TIMEOUT = 500;
function HoverPopupHandler(props) {
    var editor = props.editor;
    var hoverTimeoutId = (0, react_1.useRef)();
    var activePopup = (0, react_1.useRef)();
    (0, react_1.useEffect)(function () {
        function onMouseOver(e) {
            if (!e.target ||
                !(e.target instanceof HTMLElement) ||
                e.target.classList.contains("ProseMirror"))
                return;
            var element = e.target;
            if (activePopup.current) {
                var isOutsideEditor = !element.closest(".ProseMirror");
                var isInsidePopup = element.closest(".popup-presenter-portal");
                var isActiveElement = activePopup.current.element === element;
                if (isInsidePopup)
                    return;
                if (isOutsideEditor || !isActiveElement) {
                    console.log("HIDING", isOutsideEditor, isActiveElement, element);
                    activePopup.current.hide();
                    activePopup.current = undefined;
                    return;
                }
            }
            clearTimeout(hoverTimeoutId.current);
            hoverTimeoutId.current = setTimeout(function () {
                var nodeName = element.nodeName.toLowerCase();
                var PopupHandler = handlers[nodeName];
                if (!PopupHandler || !editor.current)
                    return;
                var pos = editor.current.view.posAtDOM(element, 0);
                var node = editor.current.view.state.doc.nodeAt(pos);
                if (!node)
                    return;
                var hidePopup = (0, popuppresenter_1.showPopup)({
                    popup: function () { return ((0, jsx_runtime_1.jsx)(PopupHandler, { editor: editor, selectedNode: {
                            node: node,
                            from: pos,
                            to: pos + node.nodeSize,
                        } })); },
                    theme: editor.storage.theme,
                    blocking: false,
                    focusOnRender: false,
                    position: {
                        target: element,
                        align: "center",
                        location: "top",
                        isTargetAbsolute: true,
                    },
                });
                activePopup.current = { element: element, hide: hidePopup };
            }, HOVER_TIMEOUT, {});
        }
        window.addEventListener("mouseover", onMouseOver);
        return function () {
            window.removeEventListener("mouseover", onMouseOver);
        };
    }, []);
    return null;
}
exports.HoverPopupHandler = HoverPopupHandler;
