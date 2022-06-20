export declare type CounterProps = {
    title: string;
    onIncrease: () => void;
    onDecrease: () => void;
    onReset: () => void;
    value: string;
};
export declare function Counter(props: CounterProps): JSX.Element;
