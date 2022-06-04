import TiptapLink from "@tiptap/extension-link";
import { Plugin, PluginKey } from "prosemirror-state";

export const Link = TiptapLink.extend({
  // addProseMirrorPlugins() {
  //   return [
  //     ...(this.parent?.() || []),
  //     new Plugin({
  //       key: new PluginKey("hoverHandler"),
  //       props: {
  //         handleDOMEvents: {
  //           mouseover: (view, event) => {
  //             if (
  //               event.target instanceof HTMLElement &&
  //               event.target.nodeName === "A"
  //             ) {
  //               console.log("Got it!");
  //             }
  //           },
  //         },
  //       },
  //     }),
  //   ];
  // },
});
