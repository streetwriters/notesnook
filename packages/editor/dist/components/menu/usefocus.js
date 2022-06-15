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
import { useCallback, useEffect, useState } from "react";
export function useFocus(items, onAction, onClose) {
    var _a = __read(useState(-1), 2), focusIndex = _a[0], setFocusIndex = _a[1];
    var _b = __read(useState(false), 2), isSubmenuOpen = _b[0], setIsSubmenuOpen = _b[1];
    var moveItemIntoView = useCallback(function (index) {
        var item = items[index];
        if (!item)
            return;
        var element = document.getElementById(item.key);
        if (!element)
            return;
        element.scrollIntoView({
            behavior: "auto",
        });
    }, [items]);
    var onKeyDown = useCallback(function (e) {
        var as = function (i) { return items[i]; };
        var isSeperator = function (i) {
            var _a, _b;
            return items &&
                (((_a = items[i]) === null || _a === void 0 ? void 0 : _a.type) === "separator" || ((_b = as(i)) === null || _b === void 0 ? void 0 : _b.isDisabled));
        };
        var moveDown = function (i) { return (i < items.length - 1 ? ++i : 0); };
        var moveUp = function (i) { return (i > 0 ? --i : items.length - 1); };
        var hasSubmenu = function (i) { return items && as(i).menu; };
        var openSubmenu = function (index) {
            if (!hasSubmenu(index))
                return;
            setIsSubmenuOpen(true);
        };
        var closeSubmenu = function (index) {
            if (!hasSubmenu(index))
                return;
            setIsSubmenuOpen(false);
        };
        setFocusIndex(function (i) {
            var nextIndex = i;
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
    useEffect(function () {
        window.addEventListener("keydown", onKeyDown);
        return function () {
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [onKeyDown]);
    return { focusIndex: focusIndex, setFocusIndex: setFocusIndex, isSubmenuOpen: isSubmenuOpen, setIsSubmenuOpen: setIsSubmenuOpen };
}
