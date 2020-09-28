const { getTestId } = require(".");

class MenuItemIDBuilder {
  static new(type) {
    return new MenuItemIDBuilder(type);
  }
  constructor(type) {
    this.type = type;
  }

  item(itemId) {
    this.itemId = itemId;
    return this;
  }

  colorCheck(color) {
    this.itemId = "colors-" + color + "-check";
    return this;
  }

  color(color) {
    this.itemId = "colors-" + color;
    return this;
  }

  build() {
    return getTestId(`${this.type}-${this.itemId}`);
  }
}
module.exports = MenuItemIDBuilder;
