/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { create } from "zustand";
import { shallow } from "zustand/shallow";
import { isUserPremium } from "./use-is-user-premium";

const mousePosition = { x: 0, y: 0, actualX: 0, actualY: 0 };
window.addEventListener("mousemove", (e) => {
  const { x, y, actualX, actualY } = getMousePosition(e);
  mousePosition.x = x;
  mousePosition.y = y;
  mousePosition.actualX = actualX;
  mousePosition.actualY = actualY;
});

const useMenuStore = create((set) => ({
  isOpen: false,
  items: [],
  title: undefined,
  data: undefined,
  open: (items, data) =>
    set(() => ({ isOpen: true, items: mapMenuItems(items, data), data })),
  close: () =>
    set(() => ({
      isOpen: false,
      items: [],
      data: undefined,
      title: undefined
    }))
}));

export function useMenuTrigger() {
  const isOpen = useMenuStore((store) => store.isOpen);
  const target = useMenuStore((store) => store.data?.target);
  const [open, close] = useMenuStore(
    (store) => [store.open, store.close],
    shallow
  );

  return {
    openMenu: open,
    closeMenu: close,
    isOpen,
    target
  };
}

export const Menu = {
  openMenu: (items, data) => useMenuStore.getState().open(items, data),
  closeMenu: () => useMenuStore.getState().close(),
  isOpen: () => useMenuStore.getState().isOpen,
  target: () => useMenuStore.getState().target
};

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
export function getPosition(element, positionOptions) {
  const {
    relativeTo = "mouse",
    absolute = false,
    location = undefined,
    yOffset = 0
  } = positionOptions || {};

  const { x, y, width, height, actualX, actualY } =
    relativeTo === "mouse"
      ? mousePosition
      : getElementPosition(relativeTo, absolute);

  const elementWidth = element.offsetWidth;
  const elementHeight = element.offsetHeight;

  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight - 20;

  let position = { top: undefined, left: undefined };

  if (windowWidth - actualX < elementWidth) {
    const xDiff = actualX - x;
    position.left = windowWidth - elementWidth;
    position.left -= xDiff;
  } else {
    position.left = x;
    if (location === "right") position.left += width;
    else if (location === "left") position.left -= width;
  }

  if (windowHeight - actualY < elementHeight) {
    const yDiff = actualY - y;
    position.top = windowHeight - elementHeight;
    position.top -= yDiff;
  } else {
    position.top = y;
    if (location === "below") position.top += height;
    else if (location === "top") position.top -= height;
  }

  position.top = position.top < 0 ? 0 : position.top;
  position.left = position.left < 0 ? 0 : position.left;
  position.top += yOffset;

  // Adjust menu height
  if (elementHeight > windowHeight - position.top) {
    element.style.maxHeight = `${windowHeight - 20}px`;
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
    actualY: posy,
    actualX: posx
  };
}

/**
 *
 * @param {HTMLElement} element
 */
function getElementPosition(element, absolute) {
  const rect = element.getBoundingClientRect();
  const position = {
    x: element.offsetLeft,
    y: element.offsetTop,
    width: rect.width,
    height: rect.height,
    actualY: rect.y,
    actualX: rect.x
  };
  if (absolute) {
    position.x = position.actualX;
    position.y = position.actualY;
  }
  return position;
}

function mapMenuItems(items, data) {
  return items.reduce((prev, item) => {
    const {
      key,
      onClick: _onClick,
      color,
      disabled,
      hidden,
      checked,
      isPro,
      isNew,
      type,
      iconColor,
      modifier
    } = item;

    const isHidden = hidden && hidden(data, item);
    if (isHidden) return prev;

    const isSeperator = type === "separator";
    if (isSeperator) {
      prev.push({ type });
      return prev;
    }

    const title = resolveProp(item.title, data, item);
    const icon = resolveProp(item.icon, data, item);
    const isChecked = resolveProp(checked, data, item);
    const isDisabled = resolveProp(disabled, data, item);
    const items = resolveProp(item.items, data, item);
    const onClick =
      typeof _onClick === "function" && _onClick.bind(this, data, item);

    const tooltip = isDisabled || item.tooltip || title;
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

      modifier: modifier?.join("+")
    };

    if (hasSubmenu)
      menuItem.items = mapMenuItems(items, { ...data, parent: menuItem });

    prev.push(menuItem);

    return prev;
  }, []);
}

function resolveProp(prop, data, item) {
  const isFunction = typeof prop === "function";
  if (isFunction) {
    return prop.isReactComponent ? prop : prop(data, item);
  }
  return prop;
}
