/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import type {
  ForwardRefExoticComponent,
  ReactNode,
  RefAttributes
} from "react";
import type { UIElement } from "./elements";
import type { UISyntheticEvent, UIWheelEvent } from "./events";
import type { DataAttributes } from "./primitives";
import type { StyleProp, SxProp } from "./style";

export interface SplitPaneHandle {
  collapse(index: number): void;
  expand(index: number): void;
  reset(index: number): void;
  isCollapsed(index: number): boolean;
  hasExpandedSize(index: number): boolean;
}

export interface SplitPaneProps {
  direction: "vertical" | "horizontal";
  autoSaveId?: string;
  allowResize?: boolean;
  sashSize?: number;
  onChange?: (sizes: number[]) => void;
  sx?: SxProp;
  "data-test-id"?: string;
  children?: ReactNode;
}

export interface PaneProps {
  id: string;
  initialSize?: number;
  minSize?: number;
  maxSize?: number;
  snapSize?: number;
  sx?: SxProp;
  "data-test-id"?: string;
  children?: ReactNode;
}

export declare const SplitPane: ForwardRefExoticComponent<
  SplitPaneProps & RefAttributes<SplitPaneHandle>
>;
export declare function Pane(props: PaneProps): JSX.Element | null;

export declare const TITLE_BAR_HEIGHT: number;

export interface TitleBarProps {
  height?: number;
  trafficLightInset?: number;
  sx?: SxProp;
  children?: ReactNode;
}

export declare function TitleBar(props: TitleBarProps): JSX.Element | null;

export interface ScrollContainerProps extends DataAttributes {
  id?: string;
  className?: string;
  style?: StyleProp;
  sx?: SxProp;
  suppressScrollX?: boolean;
  suppressScrollY?: boolean;
  /** mac-scrollbar's prop on the web; accepted, desktop scrollbars are the platform's. */
  suppressAutoHide?: boolean;
  /** Accepted and unused on desktop: the scrollbar is the platform's. */
  minThumbSize?: number;
  trackStyle?: (horizontal?: boolean) => StyleProp;
  thumbStyle?: (horizontal?: boolean) => StyleProp;
  onScroll?: (event: UISyntheticEvent) => void;
  onWheel?: (event: UIWheelEvent) => void;
  children?: ReactNode;
}

export declare function ScrollContainer(
  props: ScrollContainerProps & RefAttributes<UIElement>
): JSX.Element;

/**
 * The two `react-dom` calls apps/web makes to draw outside the tree
 * (`ReactDOM.render` into `document.getElementById("dialogContainer")`), an
 * element to render into, and the class `container instanceof HTMLElement`
 * tests. On the web they are react-dom's, a `<div>` and the DOM's class.
 */
export declare const ReactDOM: {
  render(element: ReactNode, container: UIElement): void;
  unmountComponentAtNode(container: UIElement): boolean;
};
export declare function DomRoot(props: { id: string }): JSX.Element;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export declare const HTMLElement: new (...args: any[]) => UIElement;

/** react-freeze's `Freeze`: keeps hidden children mounted without drawing them. */
export declare function Freeze(props: {
  freeze: boolean;
  children?: ReactNode;
}): JSX.Element;

export interface LayoutRootProps {
  children?: ReactNode;
}

export declare function LayoutRoot(props: LayoutRootProps): JSX.Element;
