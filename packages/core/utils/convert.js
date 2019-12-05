export default class Convert {
  static toString(input) {
    if (!input) return;
    let type = typeof input;
    if (type === "object") return JSON.stringify(input);
    return input.toString();
  }
  static fromString(input) {
    if (!input) return;
    let firstChar = input[0];
    if (firstChar == "[" || firstChar == "{") return JSON.parse(input);
    if (!isNaN(parseFloat(input)) && input.includes("."))
      return parseFloat(input);
    if (!isNaN(parseInt(input))) return parseInt(input);
    if (parseBoolean(input) !== undefined) return parseBoolean(input);
    return input;
  }
}
function parseBoolean(value) {
  return value === "true" ? true : value === "false" ? false : undefined;
}
