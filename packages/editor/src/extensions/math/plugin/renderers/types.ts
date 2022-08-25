export type MathRenderFn = (text: string, element: HTMLElement) => void;
export type MathRenderer = {
  inline: MathRenderFn;
  block: MathRenderFn;
};
