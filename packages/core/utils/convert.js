export default class Convert {
  static toString(input) {
    try {
      let type = typeof input;
      if (type === "object") return JSON.stringify(input);
      return input.toString();
    } catch (error) {
      return input.toString();
    }
  }
  static fromString(input) {
    try {
      let firstChar = input[0];
      if (firstChar === "[" || firstChar === "{") return JSON.parse(input);
      if (parseInt(input) !== NaN) return parseInt(input);
      if (parseFloat(input) !== NaN) return parseFloat(input);
      if (parseBoolean(input) !== undefined) return parseBoolean(input);
      return input;
    } catch (error) {
      return input;
    }
  }
}
function parseBoolean(value) {
  return value === "true" ? true : value === "false" ? false : undefined;
}
