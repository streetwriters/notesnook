import { BaseHandler } from "./base";
import type { HTMLElement } from "node-html-parser";

type Task = {
  checked: boolean;
  text: string;
}

export class ZNChecklist extends BaseHandler {
  async process(element: HTMLElement): Promise<string | undefined> {
    const checkboxes = element.querySelectorAll("checkbox");
    let tasks: Task[] = [];
    for (let checkbox of checkboxes) {
      tasks.push({ text: checkbox.innerHTML, checked: checkbox.getAttribute("checked") === "true" })
    }

    return tasksToHTML(tasks);
  }
}


function tasksToHTML(tasks: Task[]) {
  return `<ul class="checklist">
        ${tasks
      .map((t) =>
        t.checked
          ? `<li class="checked">${t.text}</li>`
          : `<li>${t.text}</li>`
      )
      .join("")}
      </ul>`;
}
