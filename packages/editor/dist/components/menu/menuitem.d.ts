/// <reference types="react" />
import { MenuItem } from "./types";
declare type MenuItemProps = {
    item: MenuItem;
    isFocused: boolean;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onClick: React.MouseEventHandler<HTMLButtonElement>;
};
declare function MenuItem(props: MenuItemProps): JSX.Element;
export default MenuItem;
