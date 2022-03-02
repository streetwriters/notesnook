import { Attachment, attachmentToHTML } from "../../../models/attachment";
import { BaseHandler } from "./base";
import type { HTMLElement } from "node-html-parser";
import { getAttribute } from "../../../utils/domutils";

export class ZNResource extends BaseHandler {
  async process(element: HTMLElement): Promise<string | undefined> {
    const relativePath = element.getAttribute("relative-path");
    if (!relativePath) return;
    
    const file = this.files.find((file) => file.path?.includes(relativePath));
    if (!file) return;

    const data = file.bytes;
    const hash = await this.hasher.hash(data);
    const type = element.getAttribute("type")

    const attachment: Attachment = {
      data,
      filename: relativePath||hash,
      size: data.length,
      hash,
      hashType: this.hasher.type,
      mime: type || "application/octet-stream",
      width: getAttribute(element, "width", "number"),
      height: getAttribute(element, "height", "number"),
    };
    this.note.attachments?.push(attachment);
    return attachmentToHTML(attachment);
  }
}
