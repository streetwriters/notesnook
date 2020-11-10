class FontSizeFactory {
  constructor(scaleFactor) {
    return {
      heading: 24 * scaleFactor,
      input: 14 * scaleFactor,
      title: 14 * scaleFactor,
      subtitle: 12 * scaleFactor,
      body: 13 * scaleFactor,
      menu: 14 * scaleFactor,
      subBody: 10 * scaleFactor,
    };
  }
}
export default FontSizeFactory;
