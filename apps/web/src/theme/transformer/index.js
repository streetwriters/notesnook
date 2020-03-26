import css from "./css";

const transformers = {
  css: css
};

class TransformerFactory {
  constructor(type, theme) {
    return transformers[type](theme);
  }
}
export default TransformerFactory;
