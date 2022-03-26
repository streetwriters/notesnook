import { IZnelElement } from "./types";
import {
  getAsNumberRequired,
  getAsStringRequired,
} from "./utils";
import { HTMLElement } from "node-html-parser";


export class ZLocation implements IZnelElement {
  #locationElement: HTMLElement;
  constructor(locationElement: HTMLElement) {
    this.#locationElement = locationElement;
  }

  get longitude(): number {
    return getAsNumberRequired(this.#locationElement, "ZLongitude");
  }

  get latitude(): number {
    return getAsNumberRequired(this.#locationElement, "ZLatitude");
  }

  get city(): string {
    return getAsStringRequired(this.#locationElement, "ZCity");
  }

  validate() {
    this.longitude && this.latitude && this.city
  }
}
