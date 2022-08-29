import { Tiptap } from "./tiptap";

export function getContentFromData(type, data) {
  if (!type) return null;

  switch (type) {
    case "tiptap":
      return new Tiptap(data);
    default:
      throw new Error(
        `Unknown content type: "${type}". Please report this error at support@streetwriters.co.`
      );
  }
}
