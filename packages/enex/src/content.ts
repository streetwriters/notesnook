import { HTMLElement, Node } from "node-html-parser";
import { Resource } from "./resource";

const invalidAttributes: string[] = [
  "style",
  "lang",
  "xml:lang",
  "dir",
  "accessKey",
  "tabIndex",
];
const invalidElements: string[] = ["en-media", "en-crypt", "en-todo"];
const cssSelector: string = [
  ...invalidAttributes.map((attr) => `[${attr}]`),
  ...invalidElements,
].join(",");

type ElementHandler = (element: HTMLElement) => string | undefined;

export class Content {
  #contentElement: HTMLElement;
  constructor(contentElement: HTMLElement) {
    this.#contentElement = contentElement;
  }

  toHtml(handler?: ElementHandler): string {
    const noteElement = this.#contentElement.querySelector("en-note");
    if (!noteElement) throw new Error("Invalid content.");

    const elements = noteElement.querySelectorAll(cssSelector);
    for (let element of elements) {
      for (let attr of invalidAttributes) {
        if (element.hasAttribute(attr)) element.removeAttribute(attr);
      }

      switch (element.tagName) {
        case "en-crypt":
        case "en-todo":
        case "en-media": {
          if (handler) {
            const result = handler(element);
            if (!!result) element.replaceWith(result);
          } else element.remove();
          break;
        }
      }
    }
    return noteElement.innerHTML;
  }

  get raw(): string {
    const noteElement = this.#contentElement.querySelector("en-note");
    if (!noteElement) throw new Error("Invalid content.");
    return noteElement.innerHTML;
  }
}
