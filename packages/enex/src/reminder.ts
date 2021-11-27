import { DateUIOption, IEnexElement } from "./types";
import {
  getAsDate,
  getAsDateRequired,
  getAsNumber,
  getAsString,
  getAsStringRequired,
} from "./utils";
import { HTMLElement } from "node-html-parser";

enum ReminderStatus {
  ACTIVE = "active",
  MUTED = "muted",
}

export class Reminder implements IEnexElement {
  #reminderElement: HTMLElement;
  constructor(reminderElement: HTMLElement) {
    this.#reminderElement = reminderElement;
  }

  get created(): Date {
    return getAsDateRequired(this.#reminderElement, "created");
  }

  get updated(): Date {
    return getAsDateRequired(this.#reminderElement, "updated");
  }

  get noteLevelID(): string {
    return getAsStringRequired(this.#reminderElement, "noteLevelID");
  }

  get reminderDate(): Date | null {
    return getAsDate(this.#reminderElement, "reminderDate");
  }

  get reminderDateUIOption(): DateUIOption | null {
    return <DateUIOption | null>(
      getAsString(this.#reminderElement, "reminderDateUIOption")
    );
  }

  get dueDateOffset(): number | null {
    return getAsNumber(this.#reminderElement, "dueDateOffset");
  }

  get reminderStatus(): ReminderStatus | null {
    return <ReminderStatus | null>(
      getAsString(this.#reminderElement, "reminderStatus")
    );
  }

  validate() {
    this.created && this.updated && this.noteLevelID;
  }
}
