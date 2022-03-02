import { IZnelElement } from "./types";
import {
  getAsDateRequired,
} from "./utils";
import { HTMLElement } from "node-html-parser";

export class ZReminder implements IZnelElement {
  #reminderElement: HTMLElement;
  constructor(reminderElement: HTMLElement) {
    this.#reminderElement = reminderElement;
  }

  get createdTime(): Date {
    const time = this.#reminderElement.getAttribute("created-time");
    if (!time) throw new Error("Reminder does not have created-time attribute.");
    return new Date(time)
  }

  get modifiedTime(): Date {
    const time = this.#reminderElement.getAttribute("modified-time");
    if (!time) throw new Error("Reminder does not have modified-time attribute.");
    return new Date(time)
  }

  get isCompleted(): boolean {
    const isCompleted = this.#reminderElement.getAttribute("is-completed");
    if (!isCompleted) throw new Error("Reminder does not have is-completed attribute.");
    return Number(isCompleted) !== 0;
  }

  get isRead(): boolean {
    const isRead = this.#reminderElement.getAttribute("is-read");
    if (!isRead) throw new Error("Reminder does not have is-read attribute.");
    return Number(isRead) !== 0;
  }

  get type(): string | null {
    const type = this.#reminderElement.getAttribute("type");
    if (!type) throw new Error("Reminder does not have type attribute.");
    return type;
  }

  get reminderTime(): Date {
    return getAsDateRequired(this.#reminderElement, "ZReminderTime");
  }

  validate() {
    this.createdTime && this.modifiedTime && this.type && this.isRead && this.isCompleted && this.reminderTime;
  }
}
