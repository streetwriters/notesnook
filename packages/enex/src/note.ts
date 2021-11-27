import { Resource } from "./resource";
import { Task } from "./task";
import { IEnexElement } from "./types";
import {
  getAsDate,
  getAsNumber,
  getAsString,
  getAsStringRequired,
} from "./utils";
import { HTMLElement } from "node-html-parser";
import { Content } from "./content";

export class Note implements IEnexElement {
  #noteElement: HTMLElement;
  constructor(noteElement: HTMLElement) {
    this.#noteElement = noteElement;
    this.validate();
  }

  get title(): string {
    return getAsStringRequired(this.#noteElement, "title");
  }

  get content(): Content {
    const tag = this.#noteElement.querySelector("content");
    if (!tag) throw new Error(`content is required.`);
    return new Content(tag);
  }

  get created(): Date | null {
    return getAsDate(this.#noteElement, "created");
  }

  get updated(): Date | null {
    return getAsDate(this.#noteElement, "updated");
  }

  get tags(): string[] | undefined {
    const tagElements = this.#noteElement.getElementsByTagName("tag");
    if (!tagElements.length) return;
    const tags: string[] = [];
    for (let element of tagElements) {
      if (!element.textContent) continue;
      tags.push(element.textContent);
    }
    return tags;
  }

  get attributes(): NoteAttributes | null {
    const noteAttributeElement =
      this.#noteElement.querySelector("note-attributes");
    if (!noteAttributeElement) return null;
    return new NoteAttributes(noteAttributeElement);
  }

  get resources(): Resource[] | undefined {
    const resourceElements = this.#noteElement.getElementsByTagName("resource");
    if (!resourceElements.length) return;
    const resources: Resource[] = [];
    for (let element of resourceElements) {
      resources.push(new Resource(element));
    }
    return resources;
  }

  get tasks(): Task[] | undefined {
    const taskElements = this.#noteElement.getElementsByTagName("task");
    if (!taskElements.length) return;
    const tasks: Task[] = [];
    for (let element of taskElements) {
      tasks.push(new Task(element));
    }
    return tasks;
  }

  validate() {
    this.title && this.content;
  }
}

class NoteAttributes {
  #noteAttributesElement: HTMLElement;
  constructor(noteAttributesElement: HTMLElement) {
    this.#noteAttributesElement = noteAttributesElement;
  }

  get author(): string | null {
    return getAsString(this.#noteAttributesElement, "author");
  }

  get subjectDate(): string | null {
    return getAsString(this.#noteAttributesElement, "subject-date");
  }

  get latitude(): number | null {
    return getAsNumber(this.#noteAttributesElement, "latitude");
  }

  get longitude(): number | null {
    return getAsNumber(this.#noteAttributesElement, "longitude");
  }

  get altitude(): number | null {
    return getAsNumber(this.#noteAttributesElement, "altitude");
  }

  get source(): string | null {
    return getAsString(this.#noteAttributesElement, "source");
  }

  get sourceUrl(): string | null {
    return getAsString(this.#noteAttributesElement, "source-url");
  }

  get sourceApplication(): string | null {
    return getAsString(this.#noteAttributesElement, "source-application");
  }

  get reminderOrder(): number | null {
    return getAsNumber(this.#noteAttributesElement, "reminder-order");
  }

  get reminderTime(): Date | null {
    return getAsDate(this.#noteAttributesElement, "reminder-time");
  }

  get reminderDoneTime(): Date | null {
    return getAsDate(this.#noteAttributesElement, "reminder-done-time");
  }

  get placeName(): string | null {
    return getAsString(this.#noteAttributesElement, "place-name");
  }

  get contentClass(): string | null {
    return getAsString(this.#noteAttributesElement, "content-class");
  }
}
