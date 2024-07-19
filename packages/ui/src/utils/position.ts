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

type PositionData = {
  x: number;
  y: number;
  actualX: number;
  actualY: number;
  width?: number;
  height?: number;
};

const mousePosition: PositionData = { x: 0, y: 0, actualX: 0, actualY: 0 };
let mouseMoveListenerAttached = false;
attachMouseMoveListener();

export type PositionOptions = {
  target?: HTMLElement | "mouse" | null;
  isTargetAbsolute?: boolean;
  location?: "right" | "left" | "below" | "top";
  align?: "center" | "start" | "end";
  yOffset?: number;
  xOffset?: number;
  yAnchor?: HTMLElement;
  parent?: HTMLElement | Element;
};
export function getPosition(
  node: Node,
  options: PositionOptions
): { top: number; left: number } {
  attachMouseMoveListener();

  let element: HTMLElement;
  if (node instanceof HTMLElement) {
    element = node;
  } else if (node.parentElement !== null) {
    element = node.parentElement;
  } else {
    throw new Error(`Unsupported node type ${node.nodeType}`);
  }

  const {
    target = "mouse",
    isTargetAbsolute = false,
    location = undefined,
    yOffset = 0,
    xOffset = 0,
    align = "start",
    parent = document.body,
    yAnchor
  } = options || {};

  const { x, y, width, height, actualX, actualY } =
    target === "mouse" || target === null
      ? mousePosition
      : getElementPosition(target, isTargetAbsolute);

  const elementWidth = element.offsetWidth;
  const elementHeight = element.offsetHeight;

  const windowWidth = parent.clientWidth;
  const windowHeight = parent.clientHeight;

  const position = { top: 0, left: 0 };

  if (windowWidth - actualX < elementWidth) {
    const xDiff = actualX - x;
    position.left = windowWidth - elementWidth;
    position.left -= xDiff;
  } else {
    position.left = x;
  }

  if (width && location === "right") {
    position.left += width;
  } else if (location === "left") position.left -= elementWidth;

  if (actualY + elementHeight > windowHeight) {
    position.top = windowHeight - elementHeight;
  } else {
    position.top = y;
  }

  if (height) {
    if (location === "below") position.top += height;
    else if (location === "top") position.top = y - elementHeight;
  }

  if (width && target !== "mouse" && align === "center" && elementWidth > 0) {
    position.left -= (elementWidth - width) / 2;
  } else if (
    width &&
    target !== "mouse" &&
    align === "end" &&
    elementWidth > 0
  ) {
    position.left -= elementWidth - width;
  }

  // Adjust menu height
  if (elementHeight > windowHeight - position.top) {
    element.style.maxHeight = `${windowHeight - 20}px`;
  }

  if (yAnchor) {
    const anchorY = getElementPosition(yAnchor, isTargetAbsolute);
    position.top = anchorY.y - elementHeight;
  }

  position.top = isTargetAbsolute && position.top < 0 ? 0 : position.top;
  position.left = isTargetAbsolute && position.left < 0 ? 0 : position.left;
  position.top += location === "below" ? yOffset : -yOffset;
  position.left += xOffset;

  return position;
}

function getMousePosition(e: MouseEvent) {
  let posx = 0;
  let posy = 0;

  if (!e && window.event) e = window.event as MouseEvent;

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

export function getElementPosition(
  element: HTMLElement,
  absolute: boolean
): PositionData {
  const rect = element.getBoundingClientRect();
  const position: PositionData = {
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

function attachMouseMoveListener() {
  if (mouseMoveListenerAttached || !("window" in globalThis)) return;
  window.addEventListener("mousemove", (e) => {
    const { x, y, actualX, actualY } = getMousePosition(e);
    mousePosition.x = x;
    mousePosition.y = y;
    mousePosition.actualX = actualX;
    mousePosition.actualY = actualY;
  });
  mouseMoveListenerAttached = true;
}
