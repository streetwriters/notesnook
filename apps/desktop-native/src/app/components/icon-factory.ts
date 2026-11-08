import { createElement, type ComponentType } from "react";
import { Icon as UIIcon, type IconProps } from "@ui";

export type Icon = ComponentType<Omit<IconProps, "path" | "svg">>;

export function mdiIcon(path: string, rotate = false): Icon {
  const Component: Icon = (props) =>
    createElement(UIIcon, { rotate: rotate ? 1 : undefined, ...props, path });
  return Component;
}

export function svgIcon(svg: string, rotate = false): Icon {
  const Component: Icon = (props) =>
    createElement(UIIcon, { rotate: rotate ? 1 : undefined, ...props, svg });
  return Component;
}
