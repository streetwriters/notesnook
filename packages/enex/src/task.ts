import { Reminder } from "./reminder";
import { DateUIOption, IEnexElement } from "./types";
import {
  getAsBoolean,
  getAsDate,
  getAsDateRequired,
  getAsNumberRequired,
  getAsString,
  getAsStringRequired,
} from "./utils";
import { HTMLElement } from "node-html-parser";

export enum TaskStatus {
  OPEN = "open",
  COMPLETED = "completed",
}

export class Task implements IEnexElement {
  #taskElement: HTMLElement;
  constructor(taskElement: HTMLElement) {
    this.#taskElement = taskElement;
  }

  get title(): string {
    return getAsStringRequired(this.#taskElement, "title");
  }

  get created(): Date {
    return getAsDateRequired(this.#taskElement, "created");
  }

  get updated(): Date {
    return getAsDateRequired(this.#taskElement, "updated");
  }

  get taskStatus(): TaskStatus {
    return <TaskStatus>getAsStringRequired(this.#taskElement, "taskStatus");
  }

  get inNote(): boolean {
    return getAsBoolean(this.#taskElement, "inNote");
  }

  get taskFlag(): string {
    return getAsStringRequired(this.#taskElement, "taskFlag");
  }

  get sortWeight(): number {
    return getAsNumberRequired(this.#taskElement, "sortWeight");
  }

  get noteLevelID(): string {
    return getAsStringRequired(this.#taskElement, "noteLevelID");
  }

  get taskGroupNoteLevelID(): string {
    return getAsStringRequired(this.#taskElement, "taskGroupNoteLevelID");
  }

  get dueDate(): Date | null {
    return getAsDate(this.#taskElement, "dueDate");
  }

  get dueDateUIOption(): DateUIOption | null {
    return <DateUIOption | null>(
      getAsString(this.#taskElement, "dueDateUIOption")
    );
  }

  get timeZone(): string | null {
    return getAsString(this.#taskElement, "timeZone");
  }

  get statusUpdated(): Date | null {
    return getAsDate(this.#taskElement, "statusUpdated");
  }

  get creator(): string | null {
    return getAsString(this.#taskElement, "creator");
  }

  get lastEditor(): string | null {
    return getAsString(this.#taskElement, "lastEditor");
  }

  get reminder(): Reminder | null {
    const reminderElement = this.#taskElement.querySelector("reminder");
    if (!reminderElement) return null;

    return new Reminder(reminderElement);
  }

  validate() {
    this.title &&
      this.created &&
      this.updated &&
      this.inNote &&
      this.taskFlag &&
      this.sortWeight &&
      this.noteLevelID &&
      this.taskGroupNoteLevelID;
  }
}
