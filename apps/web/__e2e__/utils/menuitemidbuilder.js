const { getTestId } = require(".");

class MenuItemIDBuilder {
  static new(type) {
    return new MenuItemIDBuilder(type);
  }
  constructor(type) {
    this.type = type;
    this.suffix = "";
  }

  item(itemId) {
    this.itemId = itemId;
    return this;
  }

  checked() {
    this.suffix = "checked";
    return this;
  }

  build() {
    return getTestId(
      `${this.type}-${this.itemId}${this.suffix ? `-${this.suffix}` : ""}`
    );
  }
}
module.exports = MenuItemIDBuilder;
