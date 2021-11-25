import { parse } from "node-html-parser";

export const parseHTML =
  typeof DOMParser === "undefined"
    ? (input) => parse(input)
    : (input) => new DOMParser().parseFromString(input, "text/html");
