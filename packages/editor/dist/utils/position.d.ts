declare type PositionData = {
    x: number;
    y: number;
    actualX: number;
    actualY: number;
    width?: number;
    height?: number;
};
export declare type PositionOptions = {
    target?: HTMLElement | "mouse";
    isTargetAbsolute?: boolean;
    location?: "right" | "left" | "below" | "top";
    align?: "center" | "start" | "end";
    yOffset?: number;
    xOffset?: number;
    yAnchor?: HTMLElement;
    parent?: HTMLElement | Element;
};
export declare function getPosition(element: HTMLElement, options: PositionOptions): {
    top: number;
    left: number;
};
export declare function getElementPosition(element: HTMLElement, absolute: boolean): PositionData;
export {};
