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
import { HeightIndex } from "./height-index.js";

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
 * How many pixels tall a character makes a block, before anything has been
 * measured. A fixed height per type assumes every paragraph is one line, which
 * is ten times wrong in a long note, so height follows how much a block holds.
 */
const DEFAULT_PIXELS_PER_CHARACTER = 0.4;

/** How far the ratio must move before cached estimates are worth redoing. */
const RESIZE_THRESHOLD = 0.15;

const PAGE_TYPE = "page";
const TABLE_TYPE = "table";
const TABLE_ROW_TYPE = "tableRow";

/** A table row is at least this tall, however little its cells hold. */
const MIN_ROW_HEIGHT = 32;

/**
 * The layout guessed at until the editor can be measured. The width is the
 * editor's own maximum, so even the first guess is close.
 */
const DEFAULT_METRICS: Metrics = { width: 850, fontSize: 16, lineHeight: 24 };

/** Average glyph width as a fraction of font size, for proportional text. */
const CHARACTER_WIDTH = 0.5;

/** How much larger each heading level renders than body text. */
const HEADING_SCALE: Record<number, number> = {
  1: 2,
  2: 1.5,
  3: 1.25,
  4: 1.1,
  5: 1,
  6: 1
};

export type Metrics = { width: number; fontSize: number; lineHeight: number };

type Measured = { height: number; characters: number };

export class HeightMap {
  private measured = new Map<string, number>();
  private sizes = new WeakMap<ProsemirrorNode, number>();
  private indexes = new Map<string, HeightIndex & { childCount: number }>();
  private measurements = new Map<string, Measured>();
  private global: Measured = { height: 0, characters: 0 };
  private stale = false;
  private estimates = new WeakMap<ProsemirrorNode, number>();
  private metrics: Metrics = { ...DEFAULT_METRICS };

  /**
   * The layout text is wrapped in. Nothing has been measured on a first load,
   * so estimates are built from the editor's own font and width instead of a
   * fixed guess: an 800-character paragraph is however many lines it wraps to.
   */
  setMetrics(metrics: Partial<Metrics>): void {
    let changed = false;
    for (const key of ["width", "fontSize", "lineHeight"] as const) {
      const value = metrics[key];
      if (!Number.isFinite(value) || !value || value <= 0) continue;
      if (Math.abs((value as number) - this.metrics[key]) < 1) continue;
      this.metrics[key] = value as number;
      changed = true;
    }
    if (!changed) return;
    this.estimates = new WeakMap();
    this.indexes.clear();
    this.stale = true;
  }

  private get width(): number {
    return this.metrics.width;
  }

  /**
   * Pixels per unit of content for a node type. Prose wraps to many lines while
   * an image is a fixed box, so a single ratio across all types is no better
   * than the per-type constants it replaced. Each type is calibrated from its
   * own measurements and falls back to the document-wide ratio until it has
   * been seen.
   */
  private pixelsPerCharacterFor(typeName: string): number {
    const measured = this.measurements.get(typeName);
    if (measured && measured.characters > 0)
      return measured.height / measured.characters;
    if (this.global.characters > 0)
      return this.global.height / this.global.characters;
    return DEFAULT_PIXELS_PER_CHARACTER;
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

    if (node.type.name === TABLE_TYPE) return this.table(node) || base;
    if (node.type.name === TABLE_ROW_TYPE) return this.row(node);

    if (this.holdsBlocks(node)) {
      let total = 0;
      node.forEach((child) => (total += this.heightFor(child)));
      return total || base;
    }

    return this.text(node, base);
  }

  /**
   * Text is estimated from the lines it wraps to. A measured ratio for the type
   * wins once there is one, since it accounts for margins and font quirks the
   * line model cannot see.
   */
  private text(node: ProsemirrorNode, base: number): number {
    const content = node.content.size;
    if (!content) return base;

    const measured = this.measurements.get(node.type.name);
    if (measured && measured.characters > 0)
      return Math.max(
        base,
        Math.round(content * (measured.height / measured.characters))
      );

    const scale =
      node.type.name === "heading"
        ? HEADING_SCALE[Number(node.attrs.level)] ?? 1
        : 1;
    const charactersPerLine = Math.max(
      20,
      this.metrics.width / (this.metrics.fontSize * scale * CHARACTER_WIDTH)
    );
    const lines = Math.max(1, Math.ceil(content / charactersPerLine));
    return Math.max(base, Math.round(lines * this.metrics.lineHeight * scale));
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

  private table(node: ProsemirrorNode): number {
    let total = 0;
    node.forEach((row) => (total += this.estimate(row)));
    return total;
  }

  /** The cells within a row sit side by side, so the tallest one wins. */
  private row(node: ProsemirrorNode): number {
    let tallest = 0;
    node.forEach((cell) => {
      const height = this.estimate(cell);
      if (height > tallest) tallest = height;
    });
    return Math.max(MIN_ROW_HEIGHT, tallest);
  }

  /** True once measurements have moved a ratio enough to resize placeholders. */
  get placeholdersNeedResizing(): boolean {
    return this.stale;
  }

  markPlaceholdersResized(): void {
    this.stale = false;
    this.estimates = new WeakMap();
    this.indexes.clear();
  }

  heightFor(node: ProsemirrorNode): number {
    const blockId = node.attrs.blockId as string | undefined;
    if (blockId && this.measured.has(blockId)) {
      profiler.count("virtualization.heightMap.hit");
      return this.measured.get(blockId) as number;
    }
    const size = this.sizes.get(node);
    if (size !== undefined) {
      profiler.count("virtualization.heightMap.hit");
      return size;
    }
    profiler.count("virtualization.heightMap.miss");
    return this.estimate(node);
  }

  record(node: ProsemirrorNode, height: number): void {
    if (!Number.isFinite(height) || height <= 0) return;

    const blockId = node.attrs.blockId as string | undefined;
    // A row or a list item has no id of its own, so its height is remembered
    // against the node. Nodes are immutable, so editing one forgets only that
    // one, and a stand-in is the size of the thing it replaced rather than a
    // guess -- which is what stops the note shifting under the reader.
    if (!blockId) {
      const measured = Math.round(height);
      if (this.sizes.get(node) !== measured) {
        this.sizes.set(node, measured);
        this.indexes.clear();
      }
      return;
    }
    this.measured.set(blockId, Math.round(height));
    this.estimates.delete(node);
    profiler.gauge("virtualization.heightMap.size", this.measured.size);

    if (node.type.name === PAGE_TYPE) return;

    const content = node.content.size;
    if (content <= 0) return;

    const before = this.pixelsPerCharacterFor(node.type.name);
    const measured = this.measurements.get(node.type.name) ?? {
      height: 0,
      characters: 0
    };
    measured.height += height;
    measured.characters += content;
    this.measurements.set(node.type.name, measured);
    this.global.height += height;
    this.global.characters += content;

    const after = this.pixelsPerCharacterFor(node.type.name);
    if (Math.abs(after - before) / before > RESIZE_THRESHOLD) this.stale = true;
    profiler.gauge(
      "virtualization.heightMap.pixelsPerCharacter",
      Math.round((this.global.height / this.global.characters) * 1000) / 1000
    );
  }

  /**
   * Where each child of a container sits, as a running total of the heights
   * before it. The children that are off screen are hidden rather than laid
   * out, so the browser cannot be asked where they are.
   *
   * Adding up every child is too much to do while scrolling, so the answer is
   * kept until the container gains or loses a child, or a measurement moves a
   * height. Editing the text in a child does neither.
   */
  runningHeights(id: string, container: ProsemirrorNode): HeightIndex {
    const cached = this.indexes.get(id);
    if (cached && cached.childCount === container.childCount) return cached;

    const before = new Float64Array(container.childCount + 1);
    let total = 0;
    container.forEach((child, _offset, index) => {
      before[index] = total;
      total += this.heightFor(child);
    });
    before[container.childCount] = total;

    const index = { before, total, childCount: container.childCount };
    this.indexes.set(id, index);
    return index;
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
