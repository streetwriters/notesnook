export declare const DEFAULT_COLORS: string[];
declare type ColorPickerProps = {
    colors?: string[];
    color: string;
    onClear: () => void;
    expanded?: boolean;
    onChange: (color: string) => void;
    onClose?: () => void;
    title?: string;
};
export declare function ColorPicker(props: ColorPickerProps): JSX.Element;
export {};
