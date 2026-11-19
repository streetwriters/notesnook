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
import type { SxProp } from "./style";

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
  testID?: string;
  children?: ReactNode;
}

export interface PaneProps {
  id: string;
  initialSize?: number;
  minSize?: number;
  maxSize?: number;
  snapSize?: number;
  sx?: SxProp;
  testID?: string;
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

export interface ScrollContainerProps {
  sx?: SxProp;
  testID?: string;
  children?: ReactNode;
}

export declare function ScrollContainer(
  props: ScrollContainerProps
): JSX.Element;

export interface LayoutRootProps {
  children?: ReactNode;
}

export declare function LayoutRoot(props: LayoutRootProps): JSX.Element;
