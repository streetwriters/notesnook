/// <reference types="react" />
import { MenuButton } from "./types";
declare type MenuButtonProps = {
    item: MenuButton;
    isFocused?: boolean;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    onClick: (e?: any) => void;
};
export declare function MenuButton(props: MenuButtonProps): JSX.Element;
export {};
