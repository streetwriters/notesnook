import css from "./css";

const transformers = {
  css: css,
};

export type Transformers = keyof typeof transformers;
export class TransformerFactory {
  construct(type: Transformers, theme: any) {
    return transformers[type](theme);
  }
}
