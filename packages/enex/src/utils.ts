import { ISO8601DateTime } from "./iso8601datetime";
import { HTMLElement, NodeType } from "node-html-parser";

export function getAsString(
  element: HTMLElement,
  tagName: string
): string | null {
  const tag = findChild(element, tagName);
  if (!tag) return null;
  return tag.textContent.trim();
}

export function getAsStringRequired(
  element: HTMLElement,
  tagName: string
): string {
  const tag = findChild(element, tagName);
  if (!tag || !tag.textContent) throw new Error(`${tagName} is required.`);
  return tag.textContent.trim();
}

export function getAsNumber(
  element: HTMLElement,
  tagName: string
): number | null {
  const tag = parseFloat(getAsString(element, tagName) || "");
  if (isNaN(tag)) return null;
  return tag;
}

export function getAsNumberRequired(
  element: HTMLElement,
  tagName: string
): number {
  const tag = parseFloat(getAsStringRequired(element, tagName));
  if (isNaN(tag)) throw new Error(`${tagName} value is an invalid number.`);
  return tag;
}

export function getAsBoolean(element: HTMLElement, tagName: string): boolean {
  const tag = getAsString(element, tagName);
  return tag === "true";
}

export function getAsDate(element: HTMLElement, tagName: string): Date | null {
  const time = getAsString(element, tagName);
  if (!time) return null;
  return ISO8601DateTime.toDate(time);
}

export function getAsDateRequired(element: HTMLElement, tagName: string): Date {
  const time = getAsStringRequired(element, tagName);
  const date = ISO8601DateTime.toDate(time);
  if (!date) throw new Error(`${tagName} value is an invalid date.`);
  return date;
}

function findChild(element: HTMLElement, tagName: string): HTMLElement | null {
  for (let child of element.childNodes) {
    if (
      child.nodeType === NodeType.ELEMENT_NODE &&
      (<HTMLElement>child).tagName.toLowerCase() === tagName.toLowerCase()
    ) {
      return <HTMLElement>child;
    }
  }
  return null;
}
