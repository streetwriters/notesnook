import Tiny from "./tiny";

export function getContentFromData(type, data) {
  switch (type) {
    case "tiny":
      return new Tiny(data);
    default:
      return null;
  }
}
