/// <reference types="react" />
import { MenuItem } from "../../components/menu/types";
declare type DropdownProps = {
    selectedItem: string | JSX.Element;
    items: MenuItem[];
    buttonRef?: React.MutableRefObject<HTMLButtonElement | undefined>;
};
export declare function Dropdown(props: DropdownProps): JSX.Element;
export {};
