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
  Node as ProseNode,
  Mark,
  Slice,
  NodeType,
  MarkType,
  Fragment
} from "prosemirror-model";

////////////////////////////////////////////////////////////////////////////////

type TypedNode<T extends string> = ProseNode & {
  type: NodeType & { name: T };
};
type TypedMark<T extends string> = Mark & {
  type: MarkType & { name: T };
};

type NodeSerializer<T extends string> = (node: TypedNode<T>) => string;
type MarkSerializer<T extends string> = (mark: TypedMark<T>) => string;

class ProseMirrorTextSerializer {
  public nodes: { [name: string]: NodeSerializer<string> | undefined };
  public marks: { [name: string]: MarkSerializer<string> | undefined };

  constructor(
    fns: {
      nodes?: { [name: string]: NodeSerializer<string> | undefined };
      marks?: { [name: string]: MarkSerializer<string> | undefined };
    },
    base?: ProseMirrorTextSerializer
  ) {
    // use base serializer as a fallback
    this.nodes = { ...base?.nodes, ...fns.nodes };
    this.marks = { ...base?.marks, ...fns.marks };
  }

  serializeFragment(fragment: Fragment): string {
    // adapted from the undocumented `Fragment.textBetween` function
    // https://github.com/ProseMirror/prosemirror-model/blob/eef20c8c6dbf841b1d70859df5d59c21b5108a4f/src/fragment.js#L46
    const blockSeparator = "\n\n";
    const leafText: string | undefined = undefined;
    let text = "";
    let separated = true;

    const from = 0;
    const to = fragment.size;

    fragment.nodesBetween(
      from,
      to,
      (node, pos) => {
        // check if one of our custom serializers handles this node
        const serialized: string | null = this.serializeNode(node);
        if (serialized !== null) {
          text += serialized;
          return false;
        }

        if (node.isText) {
          text += node.text?.slice(Math.max(from, pos) - pos, to - pos) || "";
          separated = !blockSeparator;
        } else if (node.isLeaf && leafText) {
          text += leafText;
          separated = !blockSeparator;
        } else if (!separated && node.isBlock) {
          text += blockSeparator;
          separated = true;
        }
      },
      0
    );

    return text;
  }

  serializeSlice(slice: Slice): string {
    return this.serializeFragment(slice.content);
  }

  serializeNode(node: ProseNode): string | null {
    // check if one of our custom serializers handles this node
    const nodeSerializer = this.nodes[node.type.name];
    if (nodeSerializer !== undefined) {
      return nodeSerializer(node);
    } else {
      return null;
    }
  }
}

export const mathSerializer = new ProseMirrorTextSerializer({
  nodes: {
    math_inline: (node) => `$${node.textContent}$`,
    math_display: (node) => `\n\n$$\n${node.textContent}\n$$`
  }
});
