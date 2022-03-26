import { ZMeta } from "./src/meta";
import { IZnelElement } from "./src/types";
import { parse, HTMLElement } from "node-html-parser";
import { ZReminder } from "./src/reminder";
import { ZContent } from "./src/content";

export class Znel implements IZnelElement {
  #znoteElement: HTMLElement;
  constructor(znel: string) {
    const document = parse(znel);

    const element = document.querySelector("znote");
    if (!element)
      throw new Error("Invalid znel file. Must contain ZNote element.");
    this.#znoteElement = element;

    this.validate();
  }

  get version(): string {
    const version = this.#znoteElement.getAttribute("znelVersion");
    if (!version)
      throw new Error("Invalid znel. znelVersion attribute is required.");
    return version;
  }

 get metadata(): ZMeta {
    const metadataElement = this.#znoteElement.querySelector("zmeta");
    if (!metadataElement) throw new Error("Invalid znel. No ZMeta element found");
    return new ZMeta(metadataElement)
  }

  get tags() : string[] {
    const tags: string[] = [];
    const tagElements = this.#znoteElement.querySelectorAll("ztag");
    for (let element of tagElements) {
      tags.push(element.textContent);
    }
    return tags;
  }

  get reminders() : ZReminder[] {
    const reminders: ZReminder[] = [];
    const reminderElements = this.#znoteElement.querySelectorAll("zreminder");
    for (let element of reminderElements) {
      reminders.push(new ZReminder(element));
    }
    return reminders;
  }

get content(): ZContent {
  const zcontentElement = this.#znoteElement.querySelector("zcontent");
  if (!zcontentElement) throw new Error("Invalid znel. No ZContent element found");
  return new ZContent(zcontentElement, this.metadata.noteType);
}
  
  validate() {
    this.version && this.content;
  }
}
