import { IconNames } from "../../toolbar/icons";

type MenuItemComponentProps = {
  onClick?: (e?: any) => void;
};

export type MenuItemTypes = "button" | "separator" | "popup";
export type BaseMenuItem<TType extends MenuItemTypes> = {
  type: TType;
  key: string;
  isHidden?: boolean;
};

export type MenuSeperator = BaseMenuItem<"separator">;

export type MenuPopup = BaseMenuItem<"popup"> & {
  component: (props: MenuItemComponentProps) => JSX.Element;
};

export type MenuButton = BaseMenuItem<"button"> & {
  onClick?: () => void;
  title: string;
  icon?: IconNames;
  tooltip?: string;
  isDisabled?: boolean;
  isChecked?: boolean;
  modifier?: string;
  menu?: { title: string; items: MenuItem[] };
};

export type MenuItem = MenuButton | MenuSeperator | MenuPopup;
