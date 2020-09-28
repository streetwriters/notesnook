const { getTestId } = require(".");

class ListItemIDBuilder {
  static new(type) {
    return new ListItemIDBuilder(type);
  }
  constructor(type) {
    this.type = type;
  }

  atIndex(index) {
    this.index = index;
    return this;
  }

  title() {
    this.suffix = "title";
    return this;
  }

  color(color) {
    this.suffix = "colors-" + color;
    return this;
  }

  locked() {
    this.suffix = "locked";
    return this;
  }

  body() {
    this.suffix = "body";
    return this;
  }

  grouped() {
    this.isGrouped = true;
    return this;
  }

  build() {
    if (this.isGrouped) this.index++;
    return getTestId(
      `${this.type}-${this.index}${this.suffix ? `-${this.suffix}` : ""}`
    );
  }
}
module.exports = ListItemIDBuilder;
