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

import { Readability } from "@mozilla/readability";
import { injectCss } from "./utils.js";
import { app, h, text } from "hyperapp";
import { getInlinedNode, toBlob, toJpeg, toPng } from "./domtoimage.js";
import { Config, InlineOptions } from "./types.js";
import { FetchOptions } from "./fetch.js";

type ReadabilityEnhanced = Readability<string> & {
  PRESENTATIONAL_ATTRIBUTES: string[];
};

const CLASSES = {
  nodeHover: "nn-node-selection--hover",
  nodeSelected: "nn-node-selection--selected",
  nodeSelectionContainer: "nn-node-selection-container"
};

const BLACKLIST = [CLASSES.nodeSelected, CLASSES.nodeSelectionContainer];

const inlineOptions: InlineOptions = {
  fonts: false,
  images: false,
  stylesheets: true
};

async function clipPage(
  document: Document,
  onlyVisible: boolean,
  config?: Config
): Promise<string | null> {
  const { body, head } = await getPage(document, config, onlyVisible);
  if (!body || !head) return null;
  const result = toDocument(head, body).documentElement.outerHTML;
  return `<!doctype html>\n${result}`;
}

async function clipArticle(
  doc: Document,
  config?: Config
): Promise<string | null> {
  const { body, head } = await getPage(doc, config);
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

  return `<!DOCTYPE html><html>${head?.outerHTML || ""}<body>${
    result?.content || ""
  }</body></html>`;
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
  output: TOutputFormat = "jpeg" as TOutputFormat,
  config?: Config
): Promise<TOutput> {
  const screenshotTarget = target || document.body;

  const func = output === "jpeg" ? toJpeg : output === "png" ? toPng : toBlob;
  const screenshot = await func(screenshotTarget, {
    quality: 1,
    backgroundColor: "white",
    width: document.body.scrollWidth,
    height: document.body.scrollHeight,
    fetchOptions: resolveFetchOptions(config),
    inlineOptions: {
      fonts: true,
      images: true,
      stylesheets: true
    },
    styles: true
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

function enterNodeSelectionMode(doc: Document, config?: Config) {
  setTimeout(() => {
    registerClickListeners(doc);
    registerHoverListeners(doc);
  }, 0);

  injectStyles();

  return new Promise((resolve, reject) => {
    injectNodeSelectionControls(
      async () => {
        cleanup();

        const selectedNodes = document.querySelectorAll(
          `.${CLASSES.nodeSelected}`
        );

        const div = document.createElement("div");
        for (const node of selectedNodes) {
          node.classList.remove(CLASSES.nodeSelected);
          const inlined = await getInlinedNode(node as HTMLElement, {
            raster: false,
            fetchOptions: resolveFetchOptions(config),
            inlineOptions: {
              ...inlineOptions,
              images: config?.images,
              inlineImages: config?.inlineImages
            }
          });
          if (!inlined) continue;
          div.appendChild(inlined);
        }
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
  clipScreenshot,
  enterNodeSelectionMode
};

const mod = {
  clipPage,
  clipArticle,
  cleanup,
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

  app<{ isClipping: boolean }>({
    init: {
      isClipping: false
    },
    view: ({ isClipping }) =>
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
            [
              isClipping
                ? text("Clipping selected elements. Please wait...")
                : text("Click on any element to select it.")
            ]
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
                  onclick: (state) => {
                    return [
                      { ...state, isClipping: true },
                      (dispatch) => {
                        onDone?.();
                        dispatch({ isClipping: false });
                      }
                    ];
                  },
                  style: { marginRight: "5px" },
                  disabled: isClipping
                },
                [isClipping ? text("Clipping...") : text("Clip")]
              ),
              h(
                "button",
                {
                  onclick: (state) => {
                    cleanup();
                    onCancel?.();
                    return state;
                  },
                  disabled: isClipping
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

function toDocument(head: HTMLElement, body: HTMLElement) {
  const doc = document.implementation.createHTMLDocument();
  doc.documentElement.replaceChildren(head, body);
  return doc;
}

function cleanup() {
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
}

async function getPage(
  document: Document,
  config?: Config,
  onlyVisible = false
) {
  const body = await getInlinedNode(document.body, {
    raster: true,
    fetchOptions: resolveFetchOptions(config),
    inlineOptions: {
      fonts: false,
      inlineImages: config?.inlineImages,
      images: config?.images,
      stylesheets: config?.styles
    },
    styles: config?.styles,
    filter: (node) => {
      return !onlyVisible || isElementInViewport(node);
    }
  });

  if (!body) return {};

  const head = document.createElement("head");
  const title = document.createElement("title");
  title.innerText = document.title;
  head.appendChild(title);

  return {
    body,
    head
  };
}

function resolveFetchOptions(config?: Config): FetchOptions | undefined {
  return config?.corsProxy
    ? {
        bypassCors: true,
        corsHost: config.corsProxy,
        crossOrigin: "anonymous",
        noCache: true
      }
    : undefined;
}
