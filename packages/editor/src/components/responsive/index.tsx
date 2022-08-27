import { PropsWithChildren } from "react";
import { useIsMobile } from "../../toolbar/stores/toolbar-store";
import {
  ActionSheetPresenter,
  ActionSheetPresenterProps
} from "../action-sheet";
import { MenuPresenter, MenuPresenterProps } from "../menu";

type ResponsiveContainerProps = {
  mobile?: JSX.Element;
  desktop?: JSX.Element;
};

export function ResponsiveContainer(props: ResponsiveContainerProps) {
  const isMobile = useIsMobile();
  if (isMobile) return props.mobile || null;
  else return props.desktop || null;
}

export function DesktopOnly(props: PropsWithChildren<unknown>) {
  return <ResponsiveContainer desktop={<>{props.children}</>} />;
}

export function MobileOnly(props: PropsWithChildren<unknown>) {
  return <ResponsiveContainer mobile={<>{props.children}</>} />;
}

export type PopupType = "sheet" | "menu" | "none";
export type ResponsivePresenterProps = MenuPresenterProps &
  ActionSheetPresenterProps & {
    mobile?: PopupType;
    desktop?: PopupType;
  };

export function ResponsivePresenter(
  props: PropsWithChildren<ResponsivePresenterProps>
) {
  const { mobile = "menu", desktop = "menu", ...restProps } = props;
  const isMobile = useIsMobile();
  if (isMobile && mobile === "sheet")
    return <ActionSheetPresenter {...restProps} />;
  else if (mobile === "menu" || desktop === "menu")
    return <MenuPresenter {...restProps} />;
  else return props.isOpen ? <>{props.children}</> : null;
}
