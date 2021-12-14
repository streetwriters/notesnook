import { BaseHandler } from "./base";
import type { HTMLElement } from "node-html-parser";

export class ENCodeblock extends BaseHandler {
  async process(element: HTMLElement): Promise<string | undefined> {
    return `<pre>${element.childNodes
      .map((n) => n.textContent)
      .join("<br/>")}</pre>`;
  }
}
