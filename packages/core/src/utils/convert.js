export default class Convert {
  static toString(input) {
    return JSON.stringify(input);
  }
  static fromString(input) {
    try {
      return JSON.parse(input);
    } catch (e) {
      return input;
    }
  }
}
