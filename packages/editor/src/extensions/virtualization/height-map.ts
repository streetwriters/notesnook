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

import { Node as ProsemirrorNode } from "@tiptap/pm/model";

const DEFAULT_ESTIMATES: Record<string, number> = {
  paragraph: 24,
  heading: 40,
  blockquote: 60,
  bulletList: 120,
  orderedList: 120,
  checkList: 120,
  taskList: 120,
  outlineList: 120,
  codeblock: 200,
  table: 300,
  image: 240,
  webclip: 240,
  embed: 240,
  mathBlock: 60,
  callout: 120
};

const FALLBACK_ESTIMATE = 40;

export class HeightMap {
  private measured = new Map<string, number>();

  estimate(node: ProsemirrorNode): number {
    return DEFAULT_ESTIMATES[node.type.name] ?? FALLBACK_ESTIMATE;
  }

  heightFor(node: ProsemirrorNode): number {
    const blockId = node.attrs.blockId as string | undefined;
    if (blockId && this.measured.has(blockId)) {
      return this.measured.get(blockId) as number;
    }
    return this.estimate(node);
  }

  record(node: ProsemirrorNode, height: number): void {
    const blockId = node.attrs.blockId as string | undefined;
    if (!blockId || !Number.isFinite(height) || height <= 0) return;
    this.measured.set(blockId, Math.round(height));
  }

  toJSON(): Record<string, number> {
    return Object.fromEntries(this.measured);
  }

  load(data: Record<string, number> | undefined): void {
    if (!data) return;
    for (const [id, height] of Object.entries(data)) {
      if (Number.isFinite(height) && height > 0) this.measured.set(id, height);
    }
  }
}
