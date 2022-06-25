import { useEffect } from "react";
import { LinkHandler } from "./link";
var elementHandlers = [LinkHandler];
function HoverHandler(props) {
    var editor = props.editor;
    useEffect(function () {
        function onMouseOver(e) {
            var _a;
            if (!(e.target instanceof HTMLElement))
                return;
            if ((_a = e.target) === null || _a === void 0 ? void 0 : _a.classList.contains("ProseMirror"))
                return;
            var nodeName = e.target.nodeName.toLowerCase();
            var handler = elementHandlers.find(function (h) { return h.nodeName === nodeName; });
            if (!handler)
                return;
            handler.handler(editor);
        }
        window.addEventListener("mouseover", onMouseOver);
        return function () {
            window.removeEventListener("mouseover", onMouseOver);
        };
    }, []);
    return null;
}
