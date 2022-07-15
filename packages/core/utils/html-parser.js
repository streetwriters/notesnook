import { decodeHTML5 } from "entities";

export const parseHTML = (input) =>
  new globalThis.DOMParser().parseFromString(
    wrapIntoHTMLDocument(input),
    "text/html"
  );

export function getDummyDocument() {
  const doc = parseHTML("<div></div>");
  return doc;
}

export function getInnerText(element) {
  return decodeHTML5(element.innerText || element.textContent);
}

function wrapIntoHTMLDocument(input) {
  if (typeof input !== "string") return input;
  if (input.includes("<body>")) return input;

  return `<!doctype html><html lang="en"><head><title>Document Fragment</title></head><body>${input}</body></html>`;
}
