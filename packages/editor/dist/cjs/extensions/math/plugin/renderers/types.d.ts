export declare type MathRenderFn = (text: string, element: HTMLElement) => void;
export declare type MathRenderer = {
    inline: MathRenderFn;
    block: MathRenderFn;
};
