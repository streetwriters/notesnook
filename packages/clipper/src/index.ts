/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

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

import purify from "dompurify";
import { Readability } from "@mozilla/readability";
import { injectCss } from "./utils";
import { app, h, text } from "hyperapp";
import {
  getInlinedNode,
  toBlob,
  toJpeg,
  toPixelData,
  toPng
} from "./domtoimage";
import { InlineOptions } from "./types";
import { FetchOptions } from "./fetch";

type ReadabilityEnhanced = Readability<string> & {
  PRESENTATIONAL_ATTRIBUTES: string[];
};

const CLASSES = {
  nodeHover: "nn-node-selection--hover",
  nodeSelected: "nn-node-selection--selected",
  nodeSelectionContainer: "nn-node-selection-container"
};

const BLACKLIST = [CLASSES.nodeSelected, CLASSES.nodeSelectionContainer];

const fetchOptions: FetchOptions = {
  bypassCors: true,
  corsHost: "https://cors.eu.org",
  crossOrigin: "anonymous",
  noCache: true
};

const inlineOptions: InlineOptions = {
  fonts: false,
  images: true,
  stylesheets: true
};

async function getPage(
  document: Document,
  styles: boolean,
  onlyVisible = false
) {
  const body = await getInlinedNode(document.body, {
    raster: true,
    fetchOptions,
    inlineOptions,
    filter: (node) => {
      return !onlyVisible || isElementInViewport(node);
    }
  });

  if (!body) return {};

  const head = document.createElement("head");
  head.title = document.title;

  return {
    body,
    head
  };
}

function toDocument(head: HTMLElement, body: HTMLElement) {
  const newHTMLDocument = document.implementation.createHTMLDocument();
  newHTMLDocument.open();
  newHTMLDocument.write(head.outerHTML, body.outerHTML);
  newHTMLDocument.close();

  // newHTMLDocument.insertBefore(documentType, newHTMLDocument.childNodes[0]);

  return newHTMLDocument;
}

async function clipPage(
  document: Document,
  withStyles: boolean,
  onlyVisible: boolean
): Promise<string | null> {
  const { body, head } = await getPage(document, withStyles, onlyVisible);
  if (!body || !head) return null;
  const result = toDocument(head, body).documentElement.outerHTML;
  return `<!doctype html>\n${result}`;
}

const cleanup = () => {
  setTimeout(() => {
    document.querySelectorAll(`.${CLASSES.nodeSelected}`).forEach((node) => {
      if (node instanceof HTMLElement) {
        node.classList.remove(CLASSES.nodeSelected);
      }
    });

    document
      .querySelectorAll(`.${CLASSES.nodeSelectionContainer}`)
      .forEach((node) => node.remove());

    removeHoverListeners(document);
    removeClickHandlers(document);
  }, 0);
};

function clipNode(
  element: HTMLElement | null | undefined,
  keepStyles = true
): string | null {
  if (!element) return null;
  return purifyBody(element.outerHTML, keepStyles).outerHTML;
}

async function clipArticle(
  doc: Document,
  withStyles: boolean
): Promise<string | null> {
  const { body, head } = await getPage(doc, withStyles);
  if (!body || !head) return null;
  const newDoc = toDocument(head, body);

  const readability = new Readability(newDoc);
  (readability as ReadabilityEnhanced).PRESENTATIONAL_ATTRIBUTES = [
    "align",
    "background",
    "bgcolor",
    "border",
    "cellpadding",
    "cellspacing",
    "frame",
    "hspace",
    "rules",
    "valign",
    "vspace"
  ];
  const result = readability.parse();

  return `<html>${head?.outerHTML || ""}<body>${
    result?.content || ""
  }</body></html>`;
}

// async function clipSimplifiedArticle(doc: Document): Promise<string | null> {
//   const article = await clipArticle(doc);
//   if (!article) return null;
//   return purifyBody(article, false).outerHTML;
// }

function purifyBody(htmlString: string, keepStyles = true) {
  return purify.sanitize(htmlString, {
    RETURN_DOM: true,
    KEEP_CONTENT: false,
    ADD_TAGS: keepStyles ? ["use"] : [],
    ADD_ATTR: keepStyles ? ["style", "class", "id"] : [],
    FORBID_ATTR: !keepStyles ? ["style", "class", "id"] : [],
    FORBID_TAGS: !keepStyles ? ["style"] : [],
    ADD_DATA_URI_TAGS: ["style"],
    CUSTOM_ELEMENT_HANDLING: {
      attributeNameCheck: /notesnook/ // allow all attributes containing "baz"
    }
  }) as HTMLElement;
}

async function clipScreenshot<
  TOutputFormat extends "jpeg" | "png" | "raw",
  TOutput extends TOutputFormat extends "jpeg"
    ? string
    : TOutputFormat extends "png"
    ? string
    : Blob | undefined
>(
  target?: HTMLElement,
  output: TOutputFormat = "jpeg" as TOutputFormat
): Promise<TOutput> {
  const screenshotTarget = target || document.body;

  const func = output === "jpeg" ? toJpeg : output === "png" ? toPng : toBlob;
  const screenshot = await func(screenshotTarget, {
    quality: 1,
    backgroundColor: "white",
    width: document.body.scrollWidth,
    height: document.body.scrollHeight,
    fetchOptions,
    inlineOptions: {
      fonts: true,
      images: true,
      stylesheets: true
    }
  });

  if (output === "jpeg" || output === "png")
    return `<img width="${document.body.scrollWidth}px" height="${document.body.scrollHeight}px" src="${screenshot}" />` as TOutput;
  else return screenshot as TOutput;
}

function canSelect(target: HTMLElement) {
  for (const className of BLACKLIST) {
    if (target.classList.contains(className) || target.closest(`.${className}`))
      return false;
  }
  return true;
}

const onMouseOver = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (target.classList.contains(CLASSES.nodeHover) || !canSelect(target))
    return;
  target.classList.add(CLASSES.nodeHover);
};

const onMouseLeave = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.classList.contains(CLASSES.nodeHover)) return;
  target.classList.remove(CLASSES.nodeHover);
};

function registerHoverListeners(doc: Document) {
  doc.body.addEventListener("mouseout", onMouseLeave);
  doc.body.addEventListener("mouseover", onMouseOver);
}

function removeHoverListeners(doc: Document) {
  doc.body.removeEventListener("mouseout", onMouseLeave);
  doc.body.removeEventListener("mouseover", onMouseOver);
}

const onMouseClick = (event: MouseEvent) => {
  event.preventDefault();
  const target = event.target as HTMLElement;

  if (target.classList.contains(CLASSES.nodeSelected)) {
    target.classList.remove(CLASSES.nodeSelected);
    return;
  }

  if (!canSelect(target)) return;

  target.classList.add(CLASSES.nodeSelected);
  // const clipData = clipNode(target, false);
  // useExtensionStore.getState().setClipData({
  //   type: "manualSelection",
  //   data: clipData,
  // });
};

function registerClickListeners(doc: Document) {
  doc.body.addEventListener("click", onMouseClick);
}

function removeClickHandlers(doc: Document) {
  doc.body.removeEventListener("click", onMouseClick);
}

function enterNodeSelectionMode(doc: Document) {
  setTimeout(() => {
    registerClickListeners(doc);
    registerHoverListeners(doc);
  }, 0);

  injectStyles();

  return new Promise((resolve, reject) => {
    injectNodeSelectionControls(
      async () => {
        const selectedNodes = document.querySelectorAll(
          `.${CLASSES.nodeSelected}`
        );

        const div = document.createElement("div");
        for (const node of selectedNodes) {
          node.classList.remove(CLASSES.nodeSelected);
          const inlined = await getInlinedNode(node as HTMLElement, {
            raster: false,
            fetchOptions,
            inlineOptions
          });
          if (!inlined) continue;
          div.appendChild(inlined);
        }
        cleanup();
        resolve(div?.outerHTML);
      },
      () => reject("Cancelled.")
    );
  });
}

export {
  clipPage,
  clipArticle,
  cleanup,
  clipNode,
  clipScreenshot,
  enterNodeSelectionMode
};

const mod = {
  clipPage,
  clipArticle,
  cleanup,
  clipNode,
  clipScreenshot,
  enterNodeSelectionMode
};
export type Clipper = typeof mod;

function injectStyles() {
  const css = `.${CLASSES.nodeHover} {
    border: 1px solid green;
    background-color: rgb(0,0,0,0.05);
    cursor: pointer;
  }

  .${CLASSES.nodeSelected} {
    border: 2px solid green;
    cursor: pointer;
  }
  
  .${CLASSES.nodeSelectionContainer} {
    position: fixed;
    bottom: 0px;
    right: 0px;
    z-index: ${Number.MAX_VALUE};
  }`;
  injectCss(css, "nn-clipper-styles");
}

function injectNodeSelectionControls(
  onDone?: () => void,
  onCancel?: () => void
) {
  const controlContainer = document.createElement("div");
  controlContainer.classList.add(CLASSES.nodeSelectionContainer);
  setTimeout(() => {
    document.body.appendChild(controlContainer);
  }, 0);

  app({
    init: {},
    view: () =>
      h(
        "div",
        {
          style: {
            padding: "10px",
            backgroundColor: "white",
            borderRadius: "5px",
            boxShadow: "0px 0px 10px 0px #00000038"
          }
        },
        [
          h("p", { style: { marginBottom: "0px", fontSize: "18px" } }, [
            text("Notesnook Web Clipper")
          ]),
          h(
            "p",
            {
              style: {
                margin: "0px",
                marginBottom: "5px",
                fontStyle: "italic"
              }
            },
            [text("Click on any element to select it.")]
          ),
          h(
            "div",
            {
              style: {
                display: "flex",
                alignItems: "center"
              }
            },
            [
              h(
                "button",
                {
                  onclick: (_state) => onDone?.(),
                  style: { marginRight: "5px" }
                },
                [text("Done")]
              ),
              h(
                "button",
                {
                  onclick: (_state) => {
                    cleanup();
                    onCancel?.();
                  }
                },
                [text("Cancel")]
              )
            ]
          )
        ]
      ),
    node: controlContainer
  });
}

function isElementInViewport(el: HTMLElement) {
  if (
    (el.nodeType === Node.TEXT_NODE || !el.getBoundingClientRect) &&
    el.parentElement
  )
    el = el.parentElement;

  const info = getElementViewportInfo(el);
  return info.isInViewport;
}

type ViewportInfo = {
  isInViewport: boolean;
  isPartiallyInViewport: boolean;
  isInsideViewport: boolean;
  isAroundViewport: boolean;
  isOnEdge: boolean;
  isOnTopEdge: boolean;
  isOnRightEdge: boolean;
  isOnBottomEdge: boolean;
  isOnLeftEdge: boolean;
};

function getElementViewportInfo(el: HTMLElement) {
  const result: ViewportInfo = {
    isInViewport: false,
    isPartiallyInViewport: false,
    isInsideViewport: false,
    isAroundViewport: false,
    isOnEdge: false,
    isOnTopEdge: false,
    isOnRightEdge: false,
    isOnBottomEdge: false,
    isOnLeftEdge: false
  };

  const rect = el.getBoundingClientRect();
  const windowHeight =
    window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;

  const insideX = rect.left >= 0 && rect.left + rect.width <= windowWidth;
  const insideY = rect.top >= 0 && rect.top + rect.height <= windowHeight;

  result.isInsideViewport = insideX && insideY;

  const aroundX = rect.left < 0 && rect.left + rect.width > windowWidth;
  const aroundY = rect.top < 0 && rect.top + rect.height > windowHeight;

  result.isAroundViewport = aroundX && aroundY;

  const onTop = rect.top < 0 && rect.top + rect.height > 0;
  const onRight =
    rect.left < windowWidth && rect.left + rect.width > windowWidth;
  const onLeft = rect.left < 0 && rect.left + rect.width > 0;
  const onBottom =
    rect.top < windowHeight && rect.top + rect.height > windowHeight;

  const onY = insideY || aroundY || onTop || onBottom;
  const onX = insideX || aroundX || onLeft || onRight;

  result.isOnTopEdge = onTop && onX;
  result.isOnRightEdge = onRight && onY;
  result.isOnBottomEdge = onBottom && onX;
  result.isOnLeftEdge = onLeft && onY;

  result.isOnEdge =
    result.isOnLeftEdge ||
    result.isOnRightEdge ||
    result.isOnTopEdge ||
    result.isOnBottomEdge;

  const isInX =
    insideX || aroundX || result.isOnLeftEdge || result.isOnRightEdge;
  const isInY =
    insideY || aroundY || result.isOnTopEdge || result.isOnBottomEdge;

  result.isInViewport = isInX && isInY;

  result.isPartiallyInViewport = result.isInViewport && result.isOnEdge;

  return result;
}
