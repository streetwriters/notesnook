import Delta from "./delta";

export function getContentFromData(type, data) {
  switch (type) {
    case "delta":
      return new Delta(data);
    default:
      return null;
  }
}
