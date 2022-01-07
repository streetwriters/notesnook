import create from "zustand";
import shallow from "zustand/shallow";
import { isUserPremium } from "./use-is-user-premium";

const mousePosition = {};
window.addEventListener("mousemove", (e) => {
  const { x, y } = getMousePosition(e);
  mousePosition.x = x;
  mousePosition.y = y;
});

const useMenuStore = create((set) => ({
  isOpen: false,
  items: [],
  title: undefined,
  data: undefined,
  open: (items, data) =>
    set(() => ({ isOpen: true, items: mapMenuItems(items, data), data })),
  close: () => set(() => ({ isOpen: false, items: [] })),
}));

export function useMenuTrigger() {
  const isOpen = useMenuStore((store) => store.isOpen);
  const [open, close] = useMenuStore(
    (store) => [store.open, store.close],
    shallow
  );

  return {
    openMenu: open,
    closeMenu: close,
    isOpen,
  };
}

export function useMenu() {
  const [items, data] = useMenuStore((store) => [store.items, store.data]);
  return { items, data };
}

/**
 *
 * @param {HTMLElement} element
 * @param {"mouse"|HTMLElement} relativeTo
 * @param {"right"|"below"|"left"|"top"} location
 * @returns
 */
export function getPosition(element, relativeTo = "mouse", location) {
  const { x, y, width, height } =
    relativeTo === "mouse" ? mousePosition : getElementPosition(relativeTo);

  const elementWidth = element.offsetWidth;
  const elementHeight = element.offsetHeight;

  const windowWidth = window.document.body.offsetWidth;
  const windowHeight = window.document.body.offsetHeight;

  let position = { top: undefined, left: undefined };

  if (windowWidth - x < elementWidth) {
    position.left = windowWidth - elementWidth;
  } else {
    position.left = x;

    if (location === "right") position.top += width;
    else if (location === "left") position.top -= width;
  }

  if (windowHeight - y < elementHeight) {
    position.top = windowHeight - elementHeight;
  } else {
    position.top = y;
    if (location === "below") position.top += height;
    else if (location === "top") position.top -= height;
  }

  return position;
}

function getMousePosition(e) {
  var posx = 0;
  var posy = 0;

  if (!e) e = window.event;

  if (e.pageX || e.pageY) {
    posx = e.pageX;
    posy = e.pageY;
  } else if (e.clientX || e.clientY) {
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
  };
}

/**
 *
 * @param {HTMLElement} element
 */
function getElementPosition(element) {
  return {
    x: element.offsetLeft,
    y: element.offsetTop,
    width: element.offsetWidth,
    height: element.offsetHeight,
  };
}

function mapMenuItems(items, data) {
  return items.reduce((prev, item) => {
    const {
      key,
      onClick,
      color,
      disableReason,
      disabled,
      hidden,
      checked,
      items,
      isPro,
      isNew,
      type,
      iconColor,
    } = item;

    const isHidden = hidden && hidden(data, item);
    if (isHidden) return prev;

    const isSeperator = type === "seperator";
    if (isSeperator) {
      prev.push({ isSeperator: true });
      return prev;
    }

    const title = resolveProp(item.title, data, item);
    const icon = resolveProp(item.icon, data, item);
    const isChecked = resolveProp(checked, data, item);
    const isDisabled = resolveProp(disabled, data, item);

    const tooltip = (isDisabled && disableReason) || item.tooltip || title;
    const isPremium = isPro && !isUserPremium();
    const hasSubmenu = items?.length > 0;

    const menuItem = {
      type,
      title,
      key,
      onClick,
      tooltip,

      isChecked,
      isDisabled,
      isHidden,
      hasSubmenu,
      isNew,
      isPremium,

      icon,
      color,
      iconColor,

      items,
    };

    prev.push(menuItem);

    return prev;
  }, []);
}

function resolveProp(prop, data, item) {
  const isFunction = typeof prop === "function";
  if (isFunction) {
    return prop.name === "NNIcon" ? prop : prop(data, item);
  }
  return prop;
}
