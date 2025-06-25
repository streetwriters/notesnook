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

import React from "react";

export interface HTMLElementProps {
  title?: string;
  style?: React.CSSProperties;
  className?: string;
  role?: string;
}

export interface IAxis {
  x: number;
  y: number;
}

export interface ICacheSizes {
  sizes: (string | number)[];
  sashPosSizes: (string | number)[];
}

export interface ISplitProps extends HTMLElementProps {
  autoSaveId?: string;
  allowResize?: boolean;
  direction: "vertical" | "horizontal";
  sashRender?: (index: number, active: boolean) => React.ReactNode;
  onChange?: (sizes: number[]) => void;
  onDragStart?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  onDragEnd?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  className?: string;
  sashClassName?: string;
  sashStyle?: React.CSSProperties;
  sashSize?: number;
}

export interface ISashProps {
  sashRef?: React.LegacyRef<HTMLDivElement>;
  className?: string;
  style: React.CSSProperties;
  render: (active: boolean) => React.ReactNode;
  onDragStart: React.MouseEventHandler<HTMLDivElement>;
  onDragging: React.MouseEventHandler<HTMLDivElement>;
  onDragEnd: React.MouseEventHandler<HTMLDivElement>;
  onDoubleClick: React.MouseEventHandler<HTMLDivElement>;
}

export interface ISashContentProps {
  className?: string;
  active?: boolean;
  children?: JSX.Element[];
}

export interface IPaneConfigs {
  id: string;
  paneRef?: React.LegacyRef<HTMLDivElement>;
  maxSize?: number | string;
  minSize?: number | string;
  snapSize?: number | string;
  initialSize?: number | string;
  collapsed?: boolean;
}
