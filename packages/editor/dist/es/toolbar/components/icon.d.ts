/// <reference types="react" />
import { Theme } from "@streetwriters/theme";
import { SchemeColors } from "@streetwriters/theme/dist/theme/colorscheme";
import { FlexProps } from "rebass";
declare type IconProps = {
    title?: string;
    path: string;
    size?: keyof Theme["iconSizes"] | number;
    color?: keyof SchemeColors;
    stroke?: string;
    rotate?: boolean;
};
export declare type NNIconProps = FlexProps & IconProps;
export declare function Icon(props: NNIconProps): JSX.Element;
export {};
