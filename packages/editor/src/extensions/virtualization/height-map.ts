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
import { profiler } from "../../utils/profiler.js";

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

/**
 * Pixels per unit of content, before anything has been measured. Type
 * estimates alone assume every paragraph is one line, which is wrong by an
 * order of magnitude for long-form notes, so height is derived from how much
 * content a node holds and the ratio is corrected from real measurements.
 */
const DEFAULT_PIXELS_PER_UNIT = 0.4;

/** How far the ratio must move before cached estimates are worth redoing. */
const RECALIBRATION_THRESHOLD = 0.15;

const PAGE_TYPE = "page";

type Samples = { height: number; content: number };

export class HeightMap {
  private measured = new Map<string, number>();
  private samples = new Map<string, Samples>();
  private global: Samples = { height: 0, content: 0 };
  private stale = false;

  /**
   * Pixels per unit of content for a node type. Prose wraps to many lines while
   * an image is a fixed box, so a single ratio across all types is no better
   * than the per-type constants it replaced. Each type is calibrated from its
   * own measurements and falls back to the document-wide ratio until it has
   * been seen.
   */
  private ratioFor(typeName: string): number {
    const sample = this.samples.get(typeName);
    if (sample && sample.content > 0) return sample.height / sample.content;
    if (this.global.content > 0)
      return this.global.height / this.global.content;
    return DEFAULT_PIXELS_PER_UNIT;
  }

  estimate(node: ProsemirrorNode): number {
    // A page is only as tall as what it holds: estimate each block by its own
    // type rather than assuming the page is uniform.
    if (node.type.name === PAGE_TYPE) {
      let total = 0;
      node.forEach((child) => (total += this.heightFor(child)));
      return total || FALLBACK_ESTIMATE;
    }

    // Images and embeds carry their own dimensions, so there is nothing to
    // guess: the stored height is what they will occupy.
    const stored = Number(node.attrs.height);
    if (Number.isFinite(stored) && stored > 0) return Math.round(stored);

    const base = DEFAULT_ESTIMATES[node.type.name] ?? FALLBACK_ESTIMATE;
    // `content.size` is O(1) and proportional to how much a node holds, unlike
    // `textContent`, which would copy every character of every page.
    const content = node.content.size;
    if (!content) return base;
    return Math.max(base, Math.round(content * this.ratioFor(node.type.name)));
  }

  /** True once measurements have moved a ratio enough to resize placeholders. */
  get needsRecalibration(): boolean {
    return this.stale;
  }

  markRecalibrated(): void {
    this.stale = false;
  }

  heightFor(node: ProsemirrorNode): number {
    const blockId = node.attrs.blockId as string | undefined;
    if (blockId && this.measured.has(blockId)) {
      profiler.count("virtualization.heightMap.hit");
      return this.measured.get(blockId) as number;
    }
    profiler.count("virtualization.heightMap.miss");
    return this.estimate(node);
  }

  record(node: ProsemirrorNode, height: number): void {
    const blockId = node.attrs.blockId as string | undefined;
    if (!blockId || !Number.isFinite(height) || height <= 0) return;
    this.measured.set(blockId, Math.round(height));
    profiler.gauge("virtualization.heightMap.size", this.measured.size);

    // Pages are containers; calibrating from them would average away the
    // difference between the types they hold.
    if (node.type.name === PAGE_TYPE) return;

    const content = node.content.size;
    if (content <= 0) return;

    const before = this.ratioFor(node.type.name);
    const sample = this.samples.get(node.type.name) ?? {
      height: 0,
      content: 0
    };
    sample.height += height;
    sample.content += content;
    this.samples.set(node.type.name, sample);
    this.global.height += height;
    this.global.content += content;

    const after = this.ratioFor(node.type.name);
    if (Math.abs(after - before) / before > RECALIBRATION_THRESHOLD)
      this.stale = true;
    profiler.gauge(
      "virtualization.heightMap.pixelsPerUnit",
      Math.round((this.global.height / this.global.content) * 1000) / 1000
    );
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
