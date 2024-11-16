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

import {
  Command,
  Mark,
  getMarkType,
  isMarkActive,
  markInputRule,
  markPasteRule,
  mergeAttributes,
  PasteRuleMatch
} from "@tiptap/core";
import { Plugin, TextSelection } from "@tiptap/pm/state";
import { find, registerCustomProtocol, reset } from "linkifyjs";
import { autolink } from "./helpers/autolink.js";
import { clickHandler } from "./helpers/clickHandler.js";
import { pasteHandler } from "./helpers/pasteHandler.js";
import { ImageNode } from "../image/index.js";
import { selectionToOffset } from "../../utils/prosemirror.js";

export interface LinkProtocolOptions {
  scheme: string;
  optionalSlashes?: boolean;
}

export interface LinkOptions {
  /**
   * If enabled, it adds links as you type.
   */
  autolink: boolean;
  /**
   * An array of custom protocols to be registered with linkifyjs.
   */
  protocols: Array<LinkProtocolOptions | string>;
  /**
   * If enabled, links will be opened on click.
   */
  openOnClick: boolean;
  /**
   * Adds a link to the current selection if the pasted content only contains an url.
   */
  linkOnPaste: boolean;
  /**
   * A list of HTML attributes to be rendered.
   */
  HTMLAttributes: Record<string, any>;
  /**
   * A validation function that modifies link verification for the auto linker.
   * @param url - The url to be validated.
   * @returns - True if the url is valid, false otherwise.
   */
  validate?: (url: string) => boolean;
}

export type LinkAttributes = {
  href: string;
  target?: string | null;
  rel?: string | null;
  class?: string | null;
  title?: string | null;
};
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    link: {
      /**
       * Set a link mark
       */
      setLink: (attributes: LinkAttributes) => ReturnType;
      /**
       * Toggle a link mark
       */
      toggleLink: (attributes: LinkAttributes) => ReturnType;
      /**
       * Unset a link mark
       */
      unsetLink: () => ReturnType;
    };
  }
}

export const linkRegex = /(?:__|[*#])|\[([^\]]+)\]\(.*?\)/gm;
const regExp = /(?:__|[*#])|\[.*?\]\((.*?)\)/gm;
export const Link = Mark.create<LinkOptions>({
  name: "link",

  priority: 1000,

  keepOnSplit: false,

  onCreate() {
    this.options.protocols.forEach((protocol) => {
      if (typeof protocol === "string") {
        registerCustomProtocol(protocol);
        return;
      }
      registerCustomProtocol(protocol.scheme, protocol.optionalSlashes);
    });
  },

  onDestroy() {
    reset();
  },

  inclusive() {
    return this.options.autolink;
  },

  addOptions() {
    return {
      openOnClick: true,
      linkOnPaste: true,
      autolink: true,
      protocols: [],
      HTMLAttributes: {
        target: "_blank",
        rel: "noopener noreferrer nofollow",
        class: null,
        title: null
      },
      validate: undefined
    };
  },

  addAttributes() {
    return {
      href: {
        default: null
      },
      target: {
        default: this.options.HTMLAttributes.target
      },
      rel: {
        default: this.options.HTMLAttributes.rel
      },
      class: {
        default: this.options.HTMLAttributes.class
      },
      title: {
        default: this.options.HTMLAttributes.title
      }
    };
  },

  parseHTML() {
    // return [{ tag: 'a[href]:not([href *= "javascript:" i])' }];
    return [{ tag: "a" }];
  },

  renderHTML({ HTMLAttributes }) {
    // False positive; we're explicitly checking for javascript: links to ignore them
    if (HTMLAttributes.href?.startsWith?.("javascript:")) {
      // strip out the href
      return [
        "a",
        mergeAttributes(this.options.HTMLAttributes, {
          ...HTMLAttributes,
          href: ""
        }),
        0
      ];
    }
    return [
      "a",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0
    ];
  },

  addCommands() {
    return {
      setLink: (attributes) => insertLink(attributes, false),

      toggleLink: (attributes) => insertLink(attributes, true),

      unsetLink:
        () =>
        ({ chain }) => {
          return chain()
            .unsetMark(this.name, { extendEmptyMarkRange: true })
            .setMeta("preventAutolink", true)
            .run();
        }
    };
  },

  addInputRules() {
    return [
      ...(this.parent?.() || []),
      markInputRule({
        find: linkRegex,
        type: this.type,
        getAttributes: (match) => {
          return {
            href: regExp.exec(match[0])?.[1]
          };
        }
      })
    ];
  },

  addPasteRules() {
    return [
      markPasteRule({
        find: linkRegex,
        type: this.type,
        getAttributes(match) {
          // reset in case of multiple matches
          regExp.lastIndex = 0;
          return {
            href: regExp.exec(match[0])?.[1]
          };
        }
      }),
      markPasteRule({
        find: (text) => {
          const foundLinks: PasteRuleMatch[] = [];

          if (text) {
            const links = find(text).filter((item) => item.isLink);

            if (links.length) {
              links.forEach((link) =>
                foundLinks.push({
                  text: link.value,
                  data: {
                    href: link.href
                  },
                  index: link.start
                })
              );
            }
          }

          return foundLinks;
        },
        type: this.type,
        getAttributes: (match) => {
          return {
            href: match.data?.href
          };
        }
      })
    ];
  },

  addProseMirrorPlugins() {
    const plugins: Plugin[] = [];

    if (this.options.autolink) {
      plugins.push(
        autolink({
          type: this.type,
          validate: this.options.validate
        })
      );
    }

    if (this.options.openOnClick) {
      plugins.push(
        clickHandler({
          type: this.type,
          editor: this.editor
        })
      );
    }

    if (this.options.linkOnPaste) {
      plugins.push(
        pasteHandler({
          editor: this.editor,
          type: this.type
        })
      );
    }

    return plugins;
  },

  addKeyboardShortcuts() {
    return {
      Space: ({ editor }) => {
        const { from, to } = editor.state.selection;

        if (!editor.state.doc.rangeHasMark(from, to + 1, this.type)) {
          const { tr } = editor.state;
          tr.removeStoredMark(editor.schema.marks.link);
          editor.view.dispatch(tr);
        }

        return false;
      }
    };
  }
});

const insertLink: (attributes: LinkAttributes, toggle?: boolean) => Command =
  (attributes, toggle) =>
  ({ chain, editor }) => {
    let commandChain = chain();

    const offset = selectionToOffset(editor.state);
    if (!offset) return false;
    const { from, to, node } = offset;

    const isSelection = !editor.state.selection.empty;

    const isEditing = isMarkActive(editor.state, Link.name);
    const isImage = node?.type.name === ImageNode.name;

    if (isEditing && node) {
      if (!isImage) {
        const markType = getMarkType(Link.name, editor.schema);
        commandChain = commandChain.command(({ tr }) => {
          tr.removeMark(from, to, markType);
          tr.insertText(
            attributes.title || node.textContent,
            tr.mapping.map(from),
            tr.mapping.map(to)
          );
          tr.setSelection(
            TextSelection.create(
              tr.doc,
              tr.mapping.map(from),
              tr.mapping.map(to)
            )
          );
          return true;
        });
      }

      return commandChain
        .extendMarkRange("link")
        .setMark(Link.name, attributes)
        .command(({ tr }) => {
          tr.setSelection(
            TextSelection.create(
              tr.doc,
              tr.mapping.map(editor.state.selection.from),
              tr.mapping.map(editor.state.selection.to)
            )
          );
          return true;
        })
        .focus(undefined, { scrollIntoView: true })
        .run();
    }

    commandChain = toggle
      ? commandChain.toggleMark(Link.name, attributes, {
          extendEmptyMarkRange: true
        })
      : commandChain.extendMarkRange(Link.name).setMark(Link.name, attributes);

    if (!isImage)
      commandChain = commandChain.insertContent(
        attributes.title || attributes.href
      );

    if (!isSelection && !isImage) {
      commandChain = commandChain.command(({ tr }) => {
        tr.insertText(" ", tr.mapping.map(to));
        tr.removeMark(
          tr.mapping.map(to) - 1,
          tr.mapping.map(to),
          getMarkType(Link.name, editor.schema)
        );
        return true;
      });
    }

    return commandChain.focus().setMeta("preventAutolink", true).run();
  };
