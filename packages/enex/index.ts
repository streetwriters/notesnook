import { ISO8601DateTime } from "./src/iso8601datetime";
import { Note } from "./src/note";
import { IEnexElement } from "./src/types";
import { parse, HTMLElement } from "node-html-parser";

export class Enex implements IEnexElement {
  #enexElement: HTMLElement;
  constructor(enex: string) {
    const document = parse(enex);

    const element = document.querySelector("en-export");
    if (!element)
      throw new Error("Invalid enex file. Must contain en-export element.");
    this.#enexElement = element;

    this.validate();
  }

  get exportDate(): Date {
    const exportDate = this.#enexElement.getAttribute("export-date");
    if (!exportDate)
      throw new Error("Invalid enex. export-date attribute is required.");
    const date = ISO8601DateTime.toDate(exportDate);
    if (!date) throw new Error("export-date value is not a valid date.");
    return date;
  }

  get application(): string {
    const application = this.#enexElement.getAttribute("application");
    if (!application)
      throw new Error("Invalid enex. application attribute is required.");
    return application;
  }

  get version(): string {
    const version = this.#enexElement.getAttribute("version");
    if (!version)
      throw new Error("Invalid enex. version attribute is required.");
    return version;
  }

  get notes(): Note[] {
    const noteElements = this.#enexElement.querySelectorAll("note");
    if (noteElements.length <= 0)
      throw new Error("Invalid enex. Enex file contains 0 notes.");
    const notes: Note[] = [];
    for (let element of noteElements) {
      notes.push(new Note(element));
    }
    return notes;
  }

  get isNotebook(): boolean {
    const noteElements = this.#enexElement.querySelectorAll("note");
    return noteElements.length > 1;
  }

  validate() {
    this.exportDate && this.application && this.version && this.notes;
  }
}
