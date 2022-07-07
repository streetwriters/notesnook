import { Tiptap } from "./tiptap";

export function getContentFromData(type, data) {
  switch (type) {
    case "tiptap":
      return new Tiptap(data);
    default:
      return null;
  }
}
