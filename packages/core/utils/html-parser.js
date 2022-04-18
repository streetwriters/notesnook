import { decodeHTML5 } from "entities";
import { Window } from "happy-dom";

const RealDOMParser =
  "window" in global && "DOMParser" in window
    ? new window.DOMParser()
    : new new Window().DOMParser();

export const parseHTML = (input) =>
  RealDOMParser.parseFromString(input, "text/html");

export function getDummyDocument() {
  const doc = parseHTML("<div></div>");
  return doc;
}

export function getInnerText(element) {
  return decodeHTML5(element.innerText || element.textContent);
}
