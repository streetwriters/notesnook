import { useCallback, useEffect, useState } from "react";
export function useFocus(items, onAction, onClose) {
    const [focusIndex, setFocusIndex] = useState(-1);
    const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
    const moveItemIntoView = useCallback((index) => {
        const item = items[index];
        if (!item)
            return;
        const element = document.getElementById(item.key);
        if (!element)
            return;
        element.scrollIntoView({
            behavior: "auto",
        });
    }, [items]);
    const onKeyDown = useCallback((e) => {
        const as = (i) => items[i];
        const isSeperator = (i) => {
            var _a, _b;
            return items &&
                (((_a = items[i]) === null || _a === void 0 ? void 0 : _a.type) === "separator" || ((_b = as(i)) === null || _b === void 0 ? void 0 : _b.isDisabled));
        };
        const moveDown = (i) => (i < items.length - 1 ? ++i : 0);
        const moveUp = (i) => (i > 0 ? --i : items.length - 1);
        const hasSubmenu = (i) => items && as(i).menu;
        const openSubmenu = (index) => {
            if (!hasSubmenu(index))
                return;
            setIsSubmenuOpen(true);
        };
        const closeSubmenu = (index) => {
            if (!hasSubmenu(index))
                return;
            setIsSubmenuOpen(false);
        };
        setFocusIndex((i) => {
            let nextIndex = i;
            switch (e.key) {
                case "ArrowUp":
                    if (isSubmenuOpen)
                        break;
                    nextIndex = moveUp(i);
                    while (isSeperator(nextIndex)) {
                        nextIndex = moveUp(nextIndex);
                    }
                    break;
                case "ArrowDown":
                    if (isSubmenuOpen)
                        break;
                    nextIndex = moveDown(i);
                    while (isSeperator(nextIndex)) {
                        nextIndex = moveDown(nextIndex);
                    }
                    break;
                case "ArrowRight":
                    openSubmenu(i);
                    break;
                case "ArrowLeft":
                    closeSubmenu(i);
                    break;
                case "Enter":
                    onAction && onAction(e);
                    break;
                case "Escape":
                    onClose && onClose(e);
                    break;
                default:
                    break;
            }
            if (nextIndex !== i)
                moveItemIntoView(nextIndex);
            return nextIndex;
        });
    }, [items, isSubmenuOpen, moveItemIntoView, onAction]);
    useEffect(() => {
        window.addEventListener("keydown", onKeyDown);
        return () => {
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [onKeyDown]);
    return { focusIndex, setFocusIndex, isSubmenuOpen, setIsSubmenuOpen };
}
