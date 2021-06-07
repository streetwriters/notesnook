var map = Map;
class MapStub {
  override(replacement) {
    map = replacement;
  }

  get Map() {
    return map;
  }
}

const instance = new MapStub();
module.exports = instance;
