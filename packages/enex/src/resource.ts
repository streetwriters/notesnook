import { IEnexElement } from "./types";
import { getAsBoolean, getAsNumber, getAsString } from "./utils";
import { HTMLElement } from "node-html-parser";
import SparkMD5 from "spark-md5";
import {decode} from "base64-arraybuffer"

enum MimeTypes {
  GIF = "image/gif",
  JPEG = "image/jpeg",
  PNG = "image/png",
  WAV = "audio/wav",
  MPEG = "audio/mpeg",
  PDF = "application/pdf",
  INK = "application/vnd.evernote.ink",
}

export class Resource implements IEnexElement {
  #resourceElement: HTMLElement;
  constructor(resourceElement: HTMLElement) {
    this.#resourceElement = resourceElement;
    this.validate();
  }

  get data(): string {
    const data = getAsString(this.#resourceElement, "data");
    if (!data) throw new Error("data is required.");
    return data.replace(/\s+/gm, "");
  }

  get mime(): MimeTypes {
    const mime = getAsString(this.#resourceElement, "mime");
    if (!mime) throw new Error("mime is required.");
    return <MimeTypes>mime;
  }

  get width(): number | null {
    return getAsNumber(this.#resourceElement, "width");
  }

  get height(): number | null {
    return getAsNumber(this.#resourceElement, "height");
  }

  get duration(): number | null {
    return getAsNumber(this.#resourceElement, "duration");
  }

  get alternateData(): string | null {
    return getAsString(this.#resourceElement, "alternate-data");
  }

  get attributes(): ResourceAttributes | null {
    const resourceAttributeElement = this.#resourceElement.querySelector(
      "resource-attributes"
    );
    if (!resourceAttributeElement) return null;

    return new ResourceAttributes(this.data, resourceAttributeElement);
  }

  validate() {
    this.data && this.mime;
  }
}

class ResourceAttributes {
  #resourceAttributesElement: HTMLElement;
  #resourceData: string;
  constructor(resourceData: string, resourceAttributesElement: HTMLElement) {
    this.#resourceAttributesElement = resourceAttributesElement;
    this.#resourceData = resourceData;
  }

  get latitude(): number | null {
    return getAsNumber(this.#resourceAttributesElement, "latitude");
  }

  get longitude(): number | null {
    return getAsNumber(this.#resourceAttributesElement, "longitude");
  }

  get altitude(): number | null {
    return getAsNumber(this.#resourceAttributesElement, "altitude");
  }

  get sourceUrl(): string | null {
    return getAsString(this.#resourceAttributesElement, "source-url");
  }

  get hash(): string | null {
    if (!this.#resourceData) return null;
    return SparkMD5.ArrayBuffer.hash(decode(this.#resourceData));
  }

  get cameraMake(): string | null {
    return getAsString(this.#resourceAttributesElement, "camera-make");
  }

  get cameraModel(): string | null {
    return getAsString(this.#resourceAttributesElement, "camera-model");
  }

  get recoType(): string | null {
    return getAsString(this.#resourceAttributesElement, "reco-type");
  }

  get filename(): string | null {
    return getAsString(this.#resourceAttributesElement, "file-name");
  }

  get attachment(): boolean | null {
    return getAsBoolean(this.#resourceAttributesElement, "attachment");
  }
}
