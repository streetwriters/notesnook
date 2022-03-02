import {  ZLocation } from "./location";
import { IZnelElement } from "./types";
import {
  getAsDate,
  getAsNumber,
  getAsString,
  getAsStringRequired,
} from "./utils";
import { HTMLElement } from "node-html-parser";

export type ZNoteType =
  | "note/image"
  | "note/sketch"
  | "note/checklist"
  | "note/mixed"
  | "note/file";

export class ZMeta implements IZnelElement {
  #metaElement: HTMLElement;
  constructor(metaElement: HTMLElement) {
    this.#metaElement = metaElement;
    this.validate();
  }

  get title(): string {
    return getAsStringRequired(this.#metaElement, "ZTitle");
  }

  get createdDate(): Date | null {
    return getAsDate(this.#metaElement, "ZCreatedDate");
  }

  get modifiedDate(): Date | null {
    return getAsDate(this.#metaElement, "ZModifiedDate");
  }

  get location(): ZLocation | null {
    const locationElement = this.#metaElement.querySelector("zlocation");
    if (!locationElement) return null;
    
  return new ZLocation(locationElement);
  }

  get noteColor(): string | null {
    return getAsString(this.#metaElement, "ZNoteColor");
  }

  get noteType(): ZNoteType {
    return <ZNoteType>getAsStringRequired(this.#metaElement, "ZNoteType");
  }

  validate() {
    this.title && this.noteType;
  }
}

