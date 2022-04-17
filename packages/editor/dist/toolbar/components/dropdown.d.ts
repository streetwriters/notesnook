/// <reference types="react" />
import { MenuItem } from "../../components/menu/types";
declare type DropdownProps = {
    selectedItem: string | JSX.Element;
    items: MenuItem[];
};
export declare function Dropdown(props: DropdownProps): JSX.Element;
export {};
