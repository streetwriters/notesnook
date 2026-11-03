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

import {
  computePosition,
  flip,
  offset,
  shift,
  size,
  Placement,
  ReferenceElement
} from "@floating-ui/dom";

type PositionData = {
  x: number;
  y: number;
  actualX: number;
  actualY: number;
  width?: number;
  height?: number;
};

const mousePosition = { x: 0, y: 0 };
let mouseMoveListenerAttached = false;
attachMouseMoveListener();

export type PositionOptions = {
  target?: HTMLElement | "mouse" | null;
  isTargetAbsolute?: boolean;
  location?: "right" | "left" | "below" | "top";
  align?: "center" | "start" | "end";
  yOffset?: number;
  xOffset?: number;
  gap?: number;
  yAnchor?: HTMLElement;
  parent?: HTMLElement | Element;
};
export async function getPosition(
  node: Node,
  options: PositionOptions
): Promise<{ top: number; left: number }> {
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
    location = undefined,
    yOffset = 0,
    xOffset = 0,
    gap = 0,
    align = "start",
    parent,
    yAnchor
  } = options || {};

  const side = location === "below" || !location ? "bottom" : location;
  const placement = (
    align === "center" ? side : `${side}-${align}`
  ) as Placement;
  const isVertical = side === "bottom" || side === "top";
  const boundary =
    parent && parent !== document.body ? parent : "clippingAncestors";
  const padding = 10;

  element.style.maxHeight = "";
  const { x, y } = await computePosition(
    getReference(target, yAnchor),
    element,
    {
      placement,
      strategy:
        getComputedStyle(element).position === "fixed" ? "fixed" : "absolute",
      middleware: [
        offset(({ rects }) =>
          isVertical
            ? {
                mainAxis: location
                  ? yOffset
                  : -rects.reference.height - yOffset,
                crossAxis: xOffset
              }
            : {
                mainAxis: gap + (side === "left" ? -xOffset : xOffset),
                crossAxis: -yOffset
              }
        ),
        flip({ boundary }),
        shift({ boundary, padding }),
        size({
          boundary,
          padding,
          apply({ availableHeight, rects, elements }) {
            if (rects.floating.height > availableHeight)
              elements.floating.style.maxHeight = `${Math.max(
                0,
                availableHeight
              )}px`;
          }
        })
      ]
    }
  );

  return { top: y, left: x };
}

function getReference(
  target: PositionOptions["target"],
  yAnchor?: HTMLElement
): ReferenceElement {
  if (!target || target === "mouse") {
    const { x, y } = mousePosition;
    return {
      getBoundingClientRect: () => new DOMRect(x, y, 0, 0)
    };
  }
  if (!yAnchor) return target;
  return {
    contextElement: target,
    getBoundingClientRect: () => {
      const targetRect = target.getBoundingClientRect();
      const anchorRect = yAnchor.getBoundingClientRect();
      return new DOMRect(
        targetRect.x,
        anchorRect.y,
        targetRect.width,
        anchorRect.height
      );
    }
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
    mousePosition.x = e.clientX;
    mousePosition.y = e.clientY;
  });
  mouseMoveListenerAttached = true;
}
