import { Attachment, attachmentToHTML } from "../../../models/attachment";
import { BaseHandler } from "./base";
import type { HTMLElement } from "node-html-parser";
import { getAttribute } from "../../../utils/domutils";
import { parseDataurl } from "../../../utils/dataurl";

export class IMGDataurl extends BaseHandler {
  async process(element: HTMLElement): Promise<string | undefined> {
    const src = element.getAttribute("src");
    if (!src) return;
    const dataurl = parseDataurl(src);
    if (!dataurl) return;

    const data = new Uint8Array(Buffer.from(dataurl.data, "base64"));
    const dataHash = await this.hasher.hash(data);
    const attachment: Attachment = {
      data,
      size: data.length,
      hash: dataHash,
      hashType: this.hasher.type,
      mime: dataurl.mime,
      width: getAttribute(element, "width", "number"),
      height: getAttribute(element, "height", "number"),
    };
    this.note.attachments?.push(attachment);
    return attachmentToHTML(attachment);
  }
}
