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
const TABLE_TYPE = "table";

/** A table row is at least this tall, however little its cells hold. */
const MIN_ROW_HEIGHT = 32;

type Samples = { height: number; content: number };

export class HeightMap {
  private measured = new Map<string, number>();
  private samples = new Map<string, Samples>();
  private global: Samples = { height: 0, content: 0 };
  private stale = false;
  private estimates = new WeakMap<ProsemirrorNode, number>();
  private width = 0;

  /**
   * The width content is laid out in. An image wider than the editor is scaled
   * down to fit, and its height with it.
   */
  setWidth(width: number): void {
    if (!Number.isFinite(width) || width <= 0 || width === this.width) return;
    this.width = width;
    this.estimates = new WeakMap();
  }

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

  /**
   * Estimates a node from whatever structure it actually has: an image from
   * its stored dimensions, a table from its rows, anything holding blocks from
   * the blocks themselves, and text from how much of it there is.
   */
  estimate(node: ProsemirrorNode): number {
    const cached = this.estimates.get(node);
    if (cached !== undefined) return cached;

    const height = this.computeEstimate(node);
    this.estimates.set(node, height);
    return height;
  }

  private computeEstimate(node: ProsemirrorNode): number {
    const base = DEFAULT_ESTIMATES[node.type.name] ?? FALLBACK_ESTIMATE;

    const stored = this.storedHeight(node);
    if (stored) return stored;

    // Structure beats the type's fallback: a two-row table is not as tall as
    // the average table, it is as tall as two rows.
    if (node.type.name === TABLE_TYPE) return this.table(node) || base;

    // Lists, callouts, quotes, pages: a container is as tall as its contents,
    // and its children carry their own structure down as far as it goes.
    if (this.holdsBlocks(node)) {
      let total = 0;
      node.forEach((child) => (total += this.heightFor(child)));
      return total || base;
    }

    // `content.size` is O(1) and proportional to how much text a node holds,
    // unlike `textContent`, which would copy every character of every page.
    const content = node.content.size;
    if (!content) return base;
    return Math.max(base, Math.round(content * this.ratioFor(node.type.name)));
  }

  /** Images and embeds know their own size; scale it if it must fit. */
  private storedHeight(node: ProsemirrorNode): number | undefined {
    const height = Number(node.attrs.height);
    if (!Number.isFinite(height) || height <= 0) return undefined;

    const width = Number(node.attrs.width);
    if (this.width > 0 && Number.isFinite(width) && width > this.width)
      return Math.round(height * (this.width / width));
    return Math.round(height);
  }

  private holdsBlocks(node: ProsemirrorNode): boolean {
    return node.childCount > 0 && !!node.firstChild?.isBlock;
  }

  /** Rows stack, but the cells within a row sit side by side. */
  private table(node: ProsemirrorNode): number {
    let total = 0;
    node.forEach((row) => {
      let tallest = 0;
      row.forEach((cell) => {
        const height = this.estimate(cell);
        if (height > tallest) tallest = height;
      });
      total += Math.max(MIN_ROW_HEIGHT, tallest);
    });
    return total;
  }

  /** True once measurements have moved a ratio enough to resize placeholders. */
  get needsRecalibration(): boolean {
    return this.stale;
  }

  markRecalibrated(): void {
    this.stale = false;
    this.estimates = new WeakMap();
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
    this.estimates.delete(node);
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
