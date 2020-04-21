function defer() {
  setTimeout(this, 0);
}

// eslint-disable-next-line no-extend-native
Object.defineProperty(Function.prototype, "defer", {
  value: defer,
  writable: false,
});
