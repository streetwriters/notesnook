import { Attachment, attachmentToHTML } from "../../../models/attachment";
import { BaseHandler } from "./base";
import type { HTMLElement } from "node-html-parser";
import { getAttribute } from "../../../utils/domutils";

export class ENMedia extends BaseHandler {
  async process(element: HTMLElement): Promise<string | undefined> {
    if (!this.enNote.resources) return;

    const hash = element.getAttribute("hash");
    if (!hash) return;

    const resource = this.enNote.resources?.find(
      (res) => res.attributes?.hash == hash
    );
    if (!resource) return;

    const data = new Uint8Array(Buffer.from(resource.data, "base64"));
    const dataHash = await this.hasher.hash(data);
    const attachment: Attachment = {
      data,
      filename: resource.attributes?.filename || dataHash,
      size: data.length,
      hash: dataHash,
      hashType: this.hasher.type,
      mime: resource.mime,
      width: getAttribute(element, "width", "number"),
      height: getAttribute(element, "height", "number"),
    };
    this.note.attachments?.push(attachment);
    return attachmentToHTML(attachment);
  }
}
