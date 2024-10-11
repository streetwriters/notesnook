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

import { Editor } from "../../types.js";
import { Node as PMNode, Attrs } from "prosemirror-model";

export interface ReactNodeProps {
  selected: boolean;
}
export type NodeWithAttrs<T> = PMNode & { attrs: T };
export type GetPos = GetPosNode | boolean;
export type GetPosNode = () => number;
export type ForwardRef = (node: HTMLElement | null) => void;
export type ShouldUpdate = (prevNode: PMNode, nextNode: PMNode) => boolean;
export type UpdateAttributes<T> = (
  attributes: Partial<T>,
  options?: {
    addToHistory?: boolean;
    preventUpdate?: boolean;
    forceUpdate?: boolean;
  }
) => void;
export type ContentDOM =
  | {
      dom: HTMLElement;
      contentDOM?: HTMLElement | null | undefined;
    }
  | undefined;

export type ReactNodeViewProps<TAttributes = Attrs> = {
  pos: number | undefined;
  getPos: GetPosNode;
  node: NodeWithAttrs<TAttributes>;
  editor: Editor;
  updateAttributes: UpdateAttributes<TAttributes>;
  forwardRef?: ForwardRef;
  selected: boolean;
};

export type ReactNodeViewOptions<P> = {
  props?: P;
  component?: React.ComponentType<P>;
  componentKey?: (node: PMNode) => string;
  shouldUpdate?: ShouldUpdate;
  contentDOMFactory?: ((node: PMNode) => ContentDOM) | boolean;
  wrapperFactory?: () => HTMLElement;
  forceEnableSelection?: boolean;
};
