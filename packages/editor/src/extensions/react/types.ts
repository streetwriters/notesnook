import { Editor } from "@tiptap/core";
import { Node as PMNode, Attrs } from "prosemirror-model";

export interface ReactNodeProps {
  selected: boolean;
}

export type GetPos = GetPosNode | boolean;
export type GetPosNode = () => number;
export type ForwardRef = (node: HTMLElement | null) => void;
export type ShouldUpdate = (prevNode: PMNode, nextNode: PMNode) => boolean;
export type UpdateAttributes<T> = (attributes: Partial<T>) => void;
export type ContentDOM =
  | {
      dom: HTMLElement;
      contentDOM?: HTMLElement | null | undefined;
    }
  | undefined;

export type ReactComponentProps<TAttributes = Attrs> = {
  getPos: GetPos;
  node: PMNode & { attrs: TAttributes };
  editor: Editor;
  updateAttributes: UpdateAttributes<TAttributes>;
  forwardRef?: ForwardRef;
};

export type ReactNodeViewOptions<P> = {
  props?: P;
  component?: React.ComponentType<P & ReactComponentProps>;
  shouldUpdate?: ShouldUpdate;
  contentDOMFactory?: () => ContentDOM;
  wrapperFactory?: () => HTMLElement;
};
