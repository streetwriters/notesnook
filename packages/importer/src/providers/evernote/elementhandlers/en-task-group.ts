import { Task, TaskStatus } from "@notesnook/enex/dist/src/task";
import { BaseHandler } from "./base";
import type { HTMLElement } from "node-html-parser";

export class ENTaskGroup extends BaseHandler {
  async process(element: HTMLElement): Promise<string | undefined> {
    if (!this.enNote.tasks) return;
    const taskGroupId = element.getAttribute("task-group-id");
    if (!taskGroupId) return;
    const tasks = this.enNote.tasks.filter(
      (t) => t.taskGroupNoteLevelID === taskGroupId
    );
    return tasksToHTML(tasks);
  }
}

function tasksToHTML(tasks: Task[]) {
  return `<ul class="checklist">
        ${tasks
          .map((t) =>
            t.taskStatus === TaskStatus.COMPLETED
              ? `<li class="checked">${t.title}</li>`
              : `<li>${t.title}</li>`
          )
          .join("")}
      </ul>`;
}
