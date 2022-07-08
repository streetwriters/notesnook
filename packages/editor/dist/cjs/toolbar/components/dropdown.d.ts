/// <reference types="react" />
import { MenuItem } from "../../components/menu/types";
declare type DropdownProps = {
    id: string;
    group: string;
    selectedItem: string | JSX.Element;
    items: MenuItem[];
    buttonRef?: React.MutableRefObject<HTMLButtonElement | undefined>;
    menuWidth?: number;
};
export declare function Dropdown(props: DropdownProps): JSX.Element;
export {};
