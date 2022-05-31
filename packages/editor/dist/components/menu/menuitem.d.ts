import { MenuItem } from "./types";
declare type MenuItemProps = {
    item: MenuItem;
    isFocused: boolean;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onClick: (e?: any) => void;
};
declare function MenuItem(props: MenuItemProps): JSX.Element;
export default MenuItem;
