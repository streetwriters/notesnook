var mousePosition = { x: 0, y: 0, actualX: 0, actualY: 0 };
window.addEventListener("mousemove", function (e) {
    var _a = getMousePosition(e), x = _a.x, y = _a.y, actualX = _a.actualX, actualY = _a.actualY;
    mousePosition.x = x;
    mousePosition.y = y;
    mousePosition.actualX = actualX;
    mousePosition.actualY = actualY;
});
export function getPosition(element, options) {
    var _a = options || {}, _b = _a.target, target = _b === void 0 ? "mouse" : _b, _c = _a.isTargetAbsolute, isTargetAbsolute = _c === void 0 ? false : _c, _d = _a.location, location = _d === void 0 ? undefined : _d, _e = _a.yOffset, yOffset = _e === void 0 ? 0 : _e, _f = _a.xOffset, xOffset = _f === void 0 ? 0 : _f, _g = _a.align, align = _g === void 0 ? "start" : _g, _h = _a.parent, parent = _h === void 0 ? document.body : _h, yAnchor = _a.yAnchor;
    var _j = target === "mouse"
        ? mousePosition
        : getElementPosition(target, isTargetAbsolute), x = _j.x, y = _j.y, width = _j.width, height = _j.height, actualX = _j.actualX, actualY = _j.actualY;
    var elementWidth = element.offsetWidth;
    var elementHeight = element.offsetHeight;
    var windowWidth = parent.clientWidth;
    var windowHeight = parent.clientHeight - 20;
    var position = { top: 0, left: 0 };
    if (windowWidth - actualX < elementWidth) {
        var xDiff = actualX - x;
        position.left = windowWidth - elementWidth;
        position.left -= xDiff;
    }
    else {
        position.left = x;
    }
    if (width) {
        if (location === "right")
            position.left += width;
        else if (location === "left")
            position.left -= elementWidth;
    }
    if (windowHeight - actualY < elementHeight) {
        var yDiff = actualY - y;
        position.top = windowHeight - elementHeight;
        position.top -= yDiff;
    }
    else {
        position.top = y;
    }
    if (height) {
        if (location === "below")
            position.top += height;
        else if (location === "top")
            position.top -= height;
    }
    if (target !== "mouse" && align === "center" && elementWidth > 0) {
        position.left -= elementWidth / 2 - target.clientWidth / 2;
    }
    // Adjust menu height
    if (elementHeight > windowHeight - position.top) {
        element.style.maxHeight = "".concat(windowHeight - 20, "px");
    }
    if (yAnchor) {
        var anchorY = getElementPosition(yAnchor, isTargetAbsolute);
        position.top = anchorY.actualY - elementHeight;
    }
    position.top = position.top < 0 ? 0 : position.top;
    position.left = position.left < 0 ? 0 : position.left;
    position.top += yOffset;
    position.left += xOffset;
    return position;
}
function getMousePosition(e) {
    var posx = 0;
    var posy = 0;
    if (!e && window.event)
        e = window.event;
    if (e.pageX || e.pageY) {
        posx = e.pageX;
        posy = e.pageY;
    }
    else if (e.clientX || e.clientY) {
        posx =
            e.clientX +
                document.body.scrollLeft +
                document.documentElement.scrollLeft;
        posy =
            e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }
    return {
        x: posx,
        y: posy,
        actualY: posy,
        actualX: posx,
    };
}
export function getElementPosition(element, absolute) {
    var rect = element.getBoundingClientRect();
    var position = {
        x: element.offsetLeft,
        y: element.offsetTop,
        width: rect.width,
        height: rect.height,
        actualY: rect.y,
        actualX: rect.x,
    };
    if (absolute) {
        position.x = position.actualX;
        position.y = position.actualY;
    }
    return position;
}
// function mapMenuItems<TData>(
//   items: MenuItem<TData>[],
//   data: TData
// ): ResolvedMenuItem<TData>[] {
//   return items.reduce((prev, item) => {
//     const { key, onClick: _onClick, disabled, hidden, checked, type } = item;
//     const isHidden = resolveProp(hidden, data, item);
//     if (isHidden) return prev;
//     const isSeperator = type === "seperator";
//     if (isSeperator) {
//       prev.push({ isSeperator: true });
//       return prev;
//     }
//     const title = resolveProp(item.title, data, item);
//     const icon = resolveProp(item.icon, data, item);
//     const isChecked = resolveProp(checked, data, item);
//     const isDisabled = resolveProp(disabled, data, item);
//     const items = resolveProp(item.items, data, item);
//     const modifier = resolveProp(item.modifier, data, item);
//     const onClick =
//       typeof _onClick === "function" && _onClick.bind(this, data, item);
//     const tooltip =
//       isDisabled || resolveProp(item.tooltip, data, item) || title;
//     const hasSubmenu = items?.length > 0;
//     const menuItem: ResolvedMenuItem<TData> = {
//       type,
//       title,
//       key,
//       onClick,
//       tooltip,
//       isChecked,
//       isDisabled: !!isDisabled,
//       isHidden,
//       hasSubmenu,
//       icon,
//       modifier: modifier?.join("+"),
//     };
//     if (hasSubmenu)
//       menuItem.items = mapMenuItems(items, { ...data, parent: menuItem });
//     prev.push(menuItem);
//     return prev;
//   }, []);
// }
// function resolveProp<T, TData>(
//   prop: Resolvable<T, TData>,
//   data: any,
//   item: MenuItem<TData>
// ): T {
//   if (typeof prop === "function" && (prop as any).isReactComponent) {
//     return prop as T;
//   }
//   return isResolverFunction<T, TData>(prop) ? prop(data, item) : prop;
// }
// function isResolverFunction<T, TData>(
//   prop: any
// ): prop is ResolverFunction<T, TData> {
//   return typeof prop === "function";
// }
