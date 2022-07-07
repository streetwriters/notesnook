/// <reference types="react" />
import { SxStyleProp } from "rebass";
import { IconNames } from "../../toolbar/icons";
declare type MenuItemComponentProps = {
    onClick?: (e?: any) => void;
};
export declare type MenuItemTypes = "button" | "separator" | "popup";
export declare type BaseMenuItem<TType extends MenuItemTypes> = {
    type: TType;
    key: string;
    isHidden?: boolean;
};
export declare type MenuSeperator = BaseMenuItem<"separator">;
export declare type MenuPopup = BaseMenuItem<"popup"> & {
    component: (props: MenuItemComponentProps) => JSX.Element;
};
export declare type MenuButton = BaseMenuItem<"button"> & {
    onClick?: () => void;
    title: string;
    icon?: IconNames;
    tooltip?: string;
    isDisabled?: boolean;
    isChecked?: boolean;
    modifier?: string;
    menu?: {
        title: string;
        items: MenuItem[];
    };
    styles?: SxStyleProp;
};
export declare type MenuItem = MenuButton | MenuSeperator | MenuPopup;
export {};
