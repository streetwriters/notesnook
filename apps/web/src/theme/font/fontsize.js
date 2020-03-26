class FontSizeFactory {
  constructor(scaleFactor) {
    return {
      heading: 28 * scaleFactor,
      input: 14 * scaleFactor,
      title: 18 * scaleFactor,
      subtitle: 16 * scaleFactor,
      body: 14 * scaleFactor,
      menu: 14 * scaleFactor,
      subBody: 11 * scaleFactor
    };
  }
}
export default FontSizeFactory;
