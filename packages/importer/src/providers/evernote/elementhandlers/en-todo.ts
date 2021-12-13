import { BaseHandler } from "./base";
import type { HTMLElement } from "node-html-parser";

export class ENTodo extends BaseHandler {
  async process(element: HTMLElement): Promise<string | undefined> {
    const isChecked = element.getAttribute("checked") === "true";

    const parentListItem = <HTMLElement | null>element.closest("li");
    if (!parentListItem) return;

    if (isChecked) parentListItem.classList.add("checked");

    const parentList = <HTMLElement | null>element.closest("ul");
    if (!parentList) return;

    parentList.classList.add("checklist");
    return;
  }
}
