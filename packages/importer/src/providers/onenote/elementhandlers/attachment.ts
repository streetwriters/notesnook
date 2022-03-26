import { Attachment, attachmentToHTML } from "../../../models/attachment";
import { BaseHandler } from "./base";
import type { HTMLElement } from "node-html-parser";
import { getAttribute } from "../../../utils/domutils";

export class AttachmentHandler extends BaseHandler {
  async process(element: HTMLElement): Promise<string | undefined> {
    const base64data = element.getAttribute("data");
    if (!base64data) return;

    const type = getAttributeValue(element, ["data-fullres-src-type", "data-src-type", "type"]);
    const name = getAttributeValue(element, ["data-attachment"]);

    const data = new Uint8Array(Buffer.from(base64data, "base64"));
    const dataHash = await this.hasher.hash(data);
    const attachment: Attachment = {
      data,
      size: data.length,
      hash: dataHash,
      filename: name ?? dataHash,
      hashType: this.hasher.type,
      mime: type ?? "application/octet-stream",
      width: getAttribute(element, "width", "number"),
      height: getAttribute(element, "height", "number"),
    };
    this.note.attachments?.push(attachment);
    return attachmentToHTML(attachment);
  }
}

function getAttributeValue(element: HTMLElement, attributes: string[]): string | null {
   return attributes.reduce((prev: string | null, curr) => {
     if (prev) return prev;
     
     const value = element.getAttribute(curr);
     if (value) return value;

     return prev;
   }, null)
}