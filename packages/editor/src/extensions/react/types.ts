import { Editor } from "../../types";
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
  preventUpdate?: boolean
) => void;
export type ContentDOM =
  | {
      dom: HTMLElement;
      contentDOM?: HTMLElement | null | undefined;
    }
  | undefined;

export type ReactNodeViewProps<TAttributes = Attrs> = {
  getPos: GetPosNode;
  node: NodeWithAttrs<TAttributes>;
  editor: Editor;
  updateAttributes: UpdateAttributes<TAttributes>;
  forwardRef?: ForwardRef;
};

export type SelectionBasedReactNodeViewProps<TAttributes = Attrs> =
  ReactNodeViewProps<TAttributes> & {
    selected: boolean;
  };

export type ReactNodeViewOptions<P> = {
  props?: P;
  component?: React.ComponentType<P>;
  shouldUpdate?: ShouldUpdate;
  contentDOMFactory?: (() => ContentDOM) | boolean;
  wrapperFactory?: () => HTMLElement;
};
