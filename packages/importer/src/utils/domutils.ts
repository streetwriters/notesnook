import type { HTMLElement } from "node-html-parser";

export function getAttribute<T>(
  element: HTMLElement,
  key: string,
  type: "number" | "string" = "string"
): T | undefined {
  const value = element.getAttribute(key);
  if (!value) return;

  switch (type) {
    case "number": {
      const int = parseInt(value);
      if (isNaN(int)) return;
      return <T>(<unknown>int);
    }
    default:
      return <T>(<unknown>value);
  }
}
