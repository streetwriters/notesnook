/// <reference types="react" />
import { InputProps } from "@rebass/forms";
import { FlexProps } from "rebass";
declare type LabelInputProps = InputProps & {
    label: string;
    containerProps?: FlexProps;
};
export declare function InlineInput(props: LabelInputProps): JSX.Element;
export {};
