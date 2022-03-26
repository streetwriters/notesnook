import { formatBytes } from "../utils/formatter";

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

type Attribute = {
  key: string;
  value: (value: string) => string;
};

const attributeMap: Record<string, Attribute> = {
  filename: {
    key: "data-filename",
    value: (value) => value,
  },
  size: {
    key: "data-size",
    value: (value) => {
      const bytes = parseInt(value);
      if (!isNaN(bytes)) return formatBytes(bytes, 1);
      return value;
    },
  },
  hash: {
    key: "data-hash",
    value: (value) => value,
  },
  mime: {
    key: "data-mime",
    value: (value) => value,
  },
  width: {
    key: "width",
    value: (value) => value,
  },
  height: {
    key: "height",
    value: (value) => value,
  },
};

export function attachmentToHTML(attachment: Attachment): string {
  let tag: "img" | "span" = attachment.mime.startsWith("image/")
    ? "img"
    : "span";

  let attributes: string[] = [`class="attachment"`];
  for (let attr in attributeMap) {
    const value = (<any>attachment)[attr];
    if (!value) continue;
    const attribute = attributeMap[attr];
    attributes.push(`${attribute.key}="${attribute.value(value)}"`);
  }

  switch (tag) {
    case "img":
      return `<img ${attributes.join(" ")} alt="${attachment.filename}" />`;
    case "span":
      return `<span ${attributes.join(" ")} contenteditable="false" title="${
        attachment.filename
      }">
      <em>&nbsp;</em>
      <span class="filename">${attachment.filename}</span>
    </span>`;
  }
}
