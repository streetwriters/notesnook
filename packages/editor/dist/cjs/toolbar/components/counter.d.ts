import React from "react";
export declare type CounterProps = {
    title: string;
    onIncrease: () => void;
    onDecrease: () => void;
    onReset: () => void;
    value: string;
};
declare function _Counter(props: CounterProps): JSX.Element;
export declare const Counter: React.MemoExoticComponent<typeof _Counter>;
export {};
