const { getTestId } = require(".");

class ListItemIDBuilder {
  static new(type) {
    return new ListItemIDBuilder(type);
  }

  constructor(type) {
    this.type = type;
  }

  view(viewId) {
    this.viewId = viewId;
    return this;
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

  tag(tag) {
    this.suffix = `tags-${tag}`;
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

  topic(index) {
    this.suffix = `topic-${index}`;
    return this;
  }

  grouped() {
    this.isGrouped = true;
    return this;
  }

  build() {
    if (this.isGrouped) this.index++;

    const id = getTestId(
      `${this.type}-${this.index}${this.suffix ? `-${this.suffix}` : ""}`
    );

    if (this.isGrouped) {
      this.index--;
    }
    if (this.viewId) return `#${this.viewId} ${id}`;
    return id;
  }
}
module.exports = ListItemIDBuilder;
