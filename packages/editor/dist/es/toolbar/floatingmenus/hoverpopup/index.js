import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
import { showPopup } from "../../../components/popup-presenter";
import { LinkHoverPopupHandler } from "./link";
const handlers = Object.assign({}, LinkHoverPopupHandler);
const HOVER_TIMEOUT = 500;
export function HoverPopupHandler(props) {
    const { editor } = props;
    const hoverTimeoutId = useRef();
    const activePopup = useRef();
    useEffect(() => {
        function onMouseOver(e) {
            if (!e.target ||
                !(e.target instanceof HTMLElement) ||
                e.target.classList.contains("ProseMirror"))
                return;
            const element = e.target;
            if (activePopup.current) {
                const isOutsideEditor = !element.closest(".ProseMirror");
                const isInsidePopup = element.closest(".popup-presenter-portal");
                const isActiveElement = activePopup.current.element === element;
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
            hoverTimeoutId.current = setTimeout(() => {
                const nodeName = element.nodeName.toLowerCase();
                const PopupHandler = handlers[nodeName];
                if (!PopupHandler || !editor.current)
                    return;
                const pos = editor.current.view.posAtDOM(element, 0);
                const node = editor.current.view.state.doc.nodeAt(pos);
                if (!node)
                    return;
                const hidePopup = showPopup({
                    popup: () => (_jsx(PopupHandler, { editor: editor, selectedNode: {
                            node,
                            from: pos,
                            to: pos + node.nodeSize,
                        } })),
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
                activePopup.current = { element, hide: hidePopup };
            }, HOVER_TIMEOUT, {});
        }
        window.addEventListener("mouseover", onMouseOver);
        return () => {
            window.removeEventListener("mouseover", onMouseOver);
        };
    }, []);
    return null;
}
