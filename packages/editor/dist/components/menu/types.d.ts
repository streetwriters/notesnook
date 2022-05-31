import { IconNames } from "../../toolbar/icons";
declare type MenuItemComponentProps = {
    onClick?: (e?: any) => void;
};
export declare type MenuItem = {
    type: "menuitem" | "seperator";
    key: string;
    component?: (props: MenuItemComponentProps) => JSX.Element;
    onClick?: () => void;
    title?: string;
    icon?: IconNames;
    tooltip?: string;
    isDisabled?: boolean;
    isHidden?: boolean;
    isChecked?: boolean;
    hasSubmenu?: boolean;
    modifier?: string;
    items?: MenuItem[];
};
export {};
