import React, { PropsWithChildren } from "react";
import { useToolbarStore } from "../../toolbar/stores/toolbar-store";

type ResponsiveContainerProps = {
  mobile?: JSX.Element;
  desktop?: JSX.Element;
};

export function ResponsiveContainer(props: ResponsiveContainerProps) {
  const isMobile = useToolbarStore((store) => store.isMobile);
  if (isMobile) return props.mobile || null;
  else return props.desktop || null;
}

export function DesktopOnly(props: PropsWithChildren<{}>) {
  return <ResponsiveContainer desktop={<>{props.children}</>} />;
}

export function MobileOnly(props: PropsWithChildren<{}>) {
  return <ResponsiveContainer mobile={<>{props.children}</>} />;
}
