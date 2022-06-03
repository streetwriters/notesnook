import React from "react";
import { NodeView, Decoration, DecorationSource } from "prosemirror-view";
import { Node as PMNode } from "prosemirror-model";

import { PortalProviderAPI } from "./react-portal-provider";
import { EventDispatcher } from "./event-dispatcher";
import {
  ReactNodeViewProps,
  ReactNodeViewOptions,
  GetPosNode,
  ForwardRef,
  ContentDOM,
} from "./types";
import { Editor, NodeViewRendererProps } from "@tiptap/core";
import { Theme } from "@notesnook/theme";
import { ThemeProvider } from "emotion-theming";

export class ReactNodeView<P extends ReactNodeViewProps> implements NodeView {
  private domRef!: HTMLElement;
  private contentDOMWrapper?: Node;

  contentDOM: HTMLElement | undefined;
  node: PMNode;

  constructor(
    node: PMNode,
    protected readonly editor: Editor,
    protected readonly getPos: GetPosNode,
    protected readonly portalProviderAPI: PortalProviderAPI,
    protected readonly eventDispatcher: EventDispatcher,
    protected readonly options: ReactNodeViewOptions<P>
  ) {
    this.node = node;
  }

  /**
   * This method exists to move initialization logic out of the constructor,
   * so object can be initialized properly before calling render first time.
   *
   * Example:
   * Instance properties get added to an object only after super call in
   * constructor, which leads to some methods being undefined during the
   * first render.
   */
  init() {
    this.domRef = this.createDomRef();
    // this.setDomAttrs(this.node, this.domRef);

    const { dom: contentDOMWrapper, contentDOM } = this.getContentDOM() || {
      dom: undefined,
      contentDOM: undefined,
    };

    if (this.domRef && contentDOMWrapper) {
      this.domRef.appendChild(contentDOMWrapper);
      this.contentDOM = contentDOM ? contentDOM : contentDOMWrapper;
      this.contentDOMWrapper = contentDOMWrapper || contentDOM;
    }

    // @see ED-3790
    // something gets messed up during mutation processing inside of a
    // nodeView if DOM structure has nested plain "div"s, it doesn't see the
    // difference between them and it kills the nodeView
    this.domRef.classList.add(`${this.node.type.name}-view-content-wrap`);

    this.renderReactComponent(() =>
      this.render(this.options.props, this.handleRef)
    );

    return this;
  }

  private renderReactComponent(
    component: () => React.ReactElement<any> | null
  ) {
    if (!this.domRef || !component) {
      return;
    }

    this.portalProviderAPI.render(component, this.domRef!);
  }

  createDomRef(): HTMLElement {
    if (this.options.wrapperFactory) return this.options.wrapperFactory();

    if (!this.node.isInline) {
      return document.createElement("div");
    }

    const htmlElement = document.createElement("span");
    return htmlElement;
  }

  getContentDOM(): ContentDOM {
    if (!this.options.contentDOMFactory) return;
    if (this.options.contentDOMFactory === true) {
      const content = document.createElement("div");
      content.classList.add(
        `${this.node.type.name.toLowerCase()}-content-wrapper`
      );
      content.style.whiteSpace = "inherit";
      // caret is not visible if content element width is 0px
      content.style.minWidth = `20px`;
      return { dom: content };
    }
    return this.options.contentDOMFactory?.();
  }

  handleRef = (node: HTMLElement | null) => this._handleRef(node);

  private _handleRef(node: HTMLElement | null) {
    const contentDOM = this.contentDOMWrapper || this.contentDOM;

    // move the contentDOM node inside the inner reference after rendering
    if (node && contentDOM && !node.contains(contentDOM)) {
      node.appendChild(contentDOM);
    }
  }

  render(
    props: P = {} as P,
    forwardRef?: ForwardRef
  ): React.ReactElement<any> | null {
    if (!this.options.component) return null;
    const theme = this.editor.storage.theme as Theme;
    const pos = this.getPos();

    return (
      <ThemeProvider theme={theme}>
        <this.options.component
          {...props}
          editor={this.editor}
          getPos={this.getPos}
          node={this.node}
          forwardRef={forwardRef}
          updateAttributes={(attr) => this.updateAttributes(attr, pos)}
        />
      </ThemeProvider>
    );
  }

  updateAttributes(attributes: any, pos: number) {
    this.editor.commands.command(({ tr }) => {
      tr.setNodeMarkup(pos, undefined, {
        ...this.node.attrs,
        ...attributes,
      });
      return true;
    });
  }

  update(
    node: PMNode,
    _decorations: readonly Decoration[],
    _innerDecorations: DecorationSource
    //  _innerDecorations?: Array<Decoration>,
    // validUpdate: (currentNode: PMNode, newNode: PMNode) => boolean = () => true
  ) {
    // @see https://github.com/ProseMirror/prosemirror/issues/648
    const isValidUpdate = this.node.type === node.type; // && validUpdate(this.node, node);
    if (!isValidUpdate) {
      return false;
    }

    // if (this.domRef && !this.node.sameMarkup(node)) {
    //   this.setDomAttrs(node, this.domRef);
    // }

    // View should not process a re-render if this is false.
    // We dont want to destroy the view, so we return true.
    if (!this.viewShouldUpdate(node)) {
      this.node = node;
      return true;
    }

    this.node = node;

    this.renderReactComponent(() =>
      this.render(this.options.props, this.handleRef)
    );

    return true;
  }

  ignoreMutation(
    mutation: MutationRecord | { type: "selection"; target: Element }
  ) {
    if (!this.dom || !this.contentDOM) {
      return true;
    }

    // TODO if (typeof this.options.ignoreMutation === 'function') {
    //   return this.options.ignoreMutation({ mutation })
    // }

    // a leaf/atom node is like a black box for ProseMirror
    // and should be fully handled by the node view
    if (this.node.isLeaf || this.node.isAtom) {
      return true;
    }

    // ProseMirror should handle any selections
    if (mutation.type === "selection") {
      return false;
    }

    // try to prevent a bug on mobiles that will break node views on enter
    // this is because ProseMirror can’t preventDispatch on enter
    // this will lead to a re-render of the node view on enter
    // see: https://github.com/ueberdosis/tiptap/issues/1214
    if (
      this.dom.contains(mutation.target) &&
      mutation.type === "childList" &&
      this.editor.isFocused
    ) {
      const changedNodes = [
        ...Array.from(mutation.addedNodes),
        ...Array.from(mutation.removedNodes),
      ] as HTMLElement[];

      // we’ll check if every changed node is contentEditable
      // to make sure it’s probably mutated by ProseMirror
      if (changedNodes.every((node) => node.isContentEditable)) {
        return false;
      }
    }

    // we will allow mutation contentDOM with attributes
    // so we can for example adding classes within our node view
    if (this.contentDOM === mutation.target && mutation.type === "attributes") {
      return true;
    }

    // ProseMirror should handle any changes within contentDOM
    if (this.contentDOM.contains(mutation.target)) {
      return false;
    }

    return true;
  }

  viewShouldUpdate(nextNode: PMNode): boolean {
    if (this.options.shouldUpdate)
      return this.options.shouldUpdate(this.node, nextNode);
    return true;
  }

  /**
   * Copies the attributes from a ProseMirror Node to a DOM node.
   * @param node The Prosemirror Node from which to source the attributes
   */
  setDomAttrs(node: PMNode, element: HTMLElement) {
    Object.keys(node.attrs || {}).forEach((attr) => {
      element.setAttribute(attr, node.attrs[attr]);
    });
  }

  get dom() {
    return this.domRef;
  }

  destroy() {
    if (!this.domRef) {
      return;
    }

    this.portalProviderAPI.remove(this.domRef);
    // @ts-ignore NEW PM API
    this.domRef = undefined;
    this.contentDOM = undefined;
  }
}

export function createNodeView<TProps extends ReactNodeViewProps>(
  component: React.ComponentType<TProps>,
  options?: Omit<ReactNodeViewOptions<TProps>, "component">
) {
  return ({ node, getPos, editor }: NodeViewRendererProps) => {
    const _getPos = () => (typeof getPos === "boolean" ? -1 : getPos());

    return new ReactNodeView<TProps>(
      node,
      editor,
      _getPos,
      editor.storage.portalProviderAPI,
      editor.storage.eventDispatcher,
      {
        ...options,
        component,
      }
    ).init();
  };
}

// function isiOS(): boolean {
//   return (
//     [
//       "iPad Simulator",
//       "iPhone Simulator",
//       "iPod Simulator",
//       "iPad",
//       "iPhone",
//       "iPod",
//     ].includes(navigator.platform) ||
//     // iPad on iOS 13 detection
//     (navigator.userAgent.includes("Mac") && "ontouchend" in document)
//   );
// }
