const attributeMap: Record<string, string> = {
  filename: "data-filename",
  size: "data-size",
  hash: "data-hash",
  mime: "data-mime",
  width: "width",
  height: "height",
};

export type Attachment = {
  hash: string;
  hashType: string;
  filename: string;
  size: number;
  mime: string;
  data?: Uint8Array;
  width?: number;
  height?: number;
};

export function attachmentToHTML(attachment: Attachment): string {
  let tag: "img" | "span";
  switch (attachment.mime) {
    case "image/gif":
    case "image/jpeg":
    case "image/png":
      tag = "img";
      break;
    default:
      tag = "span";
      break;
  }

  let attributes: string[] = [];
  for (let attr in attributeMap) {
    const value = (<any>attachment)[attr];
    if (!value) continue;
    const attribteName = attributeMap[attr];
    attributes.push(`${attribteName}="${value}"`);
  }
  return `<${tag} ${attributes.join(" ")}></img>`;
}
