import { HTMLElement, parse } from "node-html-parser";
import { HTMLRootElement } from "node-html-parser/dist/nodes/html";

/**
 * List of invalid attributes we should remove part of our
 * sanitizer.
 */
const invalidAttributes: string[] = ["lang"];
/**
 * This list includes attributes we want to further operate
 * on but which should otherwise be left alone.
 */
const validAttributes: string[] = ["style", "data-tag"];
/**
 * HTML output from Evernote is relatively clean but there
 * are a lot of domain-specific inline styles. This list serves
 * as a very basic inline styles sanitizer.
 */
const validStyles: string[] = [
  "background-color",
  "color",
  "text-align",
  "font-family",
  "font-size",
];
/**
 * This is a list of special elements used by Evernote for different
 * purposes.
 */
const invalidElements: string[] = ["object", "img"];
const cssSelector: string = [
  ...validAttributes.map((attr) => `[${attr}]`),
  ...invalidAttributes.map((attr) => `[${attr}]`),
  ...invalidElements,
].join(",");

export interface IElementHandler {
  process(type: string, element: HTMLElement): Promise<string | undefined>;
}

type AttachmentResolver = (url: string) => Promise<Buffer | null>;
type ContentOptions = {
  attachmentResolver: AttachmentResolver;
};

export class Content {
  #document: HTMLRootElement;
  constructor(html: string, private readonly options: ContentOptions) {
    this.#document = parse(html);
  }

  async transform(handler?: IElementHandler): Promise<string> {
    const body = this.#document.querySelector("body");
    const elements = body?.querySelectorAll(cssSelector);
    if (!body || !elements) return "";

    for (let element of elements) {
      if (!element) continue;

      let elementType =
        filterAttributes(element) || element.tagName.toLowerCase();

      switch (elementType) {
        case "checklist":
          let siblings: HTMLElement[] = [];
          const ul = this.#document.createElement("ul");
          ul.classList.add("checklist");

          let next = element;
          while (next && next.getAttribute("data-tag")?.startsWith("to-do")) {
            const li = this.#document.createElement("li");
            li.innerHTML = next.innerHTML;
            if (next.getAttribute("data-tag") === "to-do:completed")
              li.classList.add("checked");
            ul.appendChild(li);

            if (next !== element) siblings.push(next);
            next = next.nextElementSibling;
          }
          element.replaceWith(ul);

          siblings.forEach((elem) => {
            elem.removeAttribute("data-tag");
            elem.remove();
          });
          break;
        case "img":
        case "object": {
          const data = await downloadAttachment(
            element,
            ["data-fullres", "src", "data"],
            this.options.attachmentResolver
          );
          if (!data) {
            element.remove();
            break;
          }
          element.setAttribute("data", data);

          if (handler) {
            const result = await handler.process(elementType, element);
            if (!!result) element.replaceWith(result);
            else element.remove();
          } else element.remove();
          break;
        }
      }
    }
    return body.innerHTML;
  }

  get raw(): string {
    return (
      this.#document.querySelector("body")?.outerHTML ||
      this.#document.outerHTML
    );
  }

  toJSON(): string {
    return this.raw;
  }
}

function filterAttributes(element: HTMLElement): string | null {
  let elementType: string | null = null;

  for (let attr of invalidAttributes) {
    if (element.hasAttribute(attr)) element.removeAttribute(attr);
  }

  for (let attr of validAttributes) {
    if (!element.hasAttribute(attr)) continue;
    const value = element.getAttribute(attr);
    if (!value) {
      element.removeAttribute(attr);
      continue;
    }

    switch (attr) {
      case "data-tag":
        if (!value.startsWith("to-do")) break;
        elementType = "checklist";
        break;
      case "style": {
        const styles = stylesToObject(value);
        for (let style in styles) {
          if (validStyles.indexOf(style) === -1) delete styles[style];
        }
        const newStyle = objectToStyles(styles);
        if (newStyle) element.setAttribute(attr, newStyle);
        else element.removeAttribute(attr);
        break;
      }
    }
  }
  return elementType;
}

function stylesToObject(input: string): Record<string, string> {
  const styles = input.split(";");
  const output: Record<string, string> = {};
  for (let style of styles) {
    const [key, value] = style.trim().split(":");
    output[key] = value;
  }
  return output;
}

function objectToStyles(input: Record<string, string>): string {
  const output: string[] = [];
  for (let key in input) {
    output.push(`${key}:${input[key]}`);
  }
  return output.join(";");
}

async function downloadAttachment(
  element: HTMLElement,
  attributes: string[],
  resolver: AttachmentResolver
): Promise<string | false> {
  let src = null;
  for (let attribute of attributes) {
    src = element.getAttribute(attribute);
    if (src) break;
  }
  if (!src) return false;

  const data = await resolver(src);
  if (!data) throw new Error(`Failed to download attachment at ${src}.`);

  return data.toString("base64");
}
