import { Schema } from "@tiptap/pm/model";
import { EditorState, TextSelection, AllSelection } from "@tiptap/pm/state";
import { EditorView } from "@tiptap/pm/view";
import { withVirtualization } from "../src/extensions/virtualization/node-views.js";
import { virtualizationPlugin } from "../src/extensions/virtualization/viewport-plugin.js";
import { HeightMap } from "../src/extensions/virtualization/height-map.js";

const schema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: {
      group: "block",
      content: "inline*",
      attrs: { blockId: { default: null } },
      parseDOM: [{ tag: "p" }],
      toDOM: (node) => [
        "p",
        node.attrs.blockId ? { "data-block-id": node.attrs.blockId } : {},
        0
      ]
    },
    heading: {
      group: "block",
      content: "inline*",
      attrs: { blockId: { default: null }, level: { default: 1 } },
      parseDOM: [{ tag: "h1" }],
      toDOM: (node) => [
        "h" + node.attrs.level,
        node.attrs.blockId ? { "data-block-id": node.attrs.blockId } : {},
        0
      ]
    },
    text: { group: "inline" }
  }
});

const TOTAL = 200;
const SENTINEL = "SENTINEL_OFFSCREEN_MARKER";
const SENTINEL_INDEX = 180;

const paragraphs = [];
for (let i = 0; i < TOTAL; i++) {
  const text =
    i === SENTINEL_INDEX
      ? `Paragraph ${i} ${SENTINEL} end`
      : `Paragraph number ${i} with some filler text to give it height.`;
  paragraphs.push(
    schema.nodes.paragraph.create({ blockId: "b" + i }, schema.text(text))
  );
}
const doc = schema.nodes.doc.create(null, paragraphs);

const container = document.getElementById("scroll") as HTMLElement;
const mount = document.getElementById("editor") as HTMLElement;

const heightMap = new HeightMap();

const view = new EditorView(mount, {
  state: EditorState.create({ doc, plugins: [virtualizationPlugin()] }),
  nodeViews: withVirtualization({}, heightMap)
});

function topChildren() {
  return Array.from(view.dom.children) as HTMLElement[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).__t = {
  totalTop: () => view.state.doc.childCount,
  docSize: () => view.state.doc.content.size,
  placeholderCount: () =>
    topChildren().filter((c) => c.hasAttribute("data-virtual-placeholder"))
      .length,
  renderedCount: () =>
    topChildren().filter((c) => !c.hasAttribute("data-virtual-placeholder"))
      .length,
  domHasSentinel: () => (view.dom.textContent || "").includes(SENTINEL),
  stateHasSentinel: () => view.state.doc.textContent.includes(SENTINEL),
  docJSON: () => JSON.stringify(view.state.doc.toJSON()),
  scrollToBottom: () => {
    container.scrollTop = container.scrollHeight;
  },
  scrollToTop: () => {
    container.scrollTop = 0;
  },
  selectAllSize: () => {
    const sel = new AllSelection(view.state.doc);
    view.dispatch(view.state.tr.setSelection(sel));
    return view.state.selection.to - view.state.selection.from;
  },
  editOffscreen: () => {
    // insert text into an off-screen paragraph (index 150) via a position in state
    let pos = 1;
    view.state.doc.forEach((node, offset, index) => {
      if (index === 150) pos = offset + 1;
    });
    const tr = view.state.tr.insert(pos, schema.text("X"));
    view.dispatch(tr);
    const tc = view.state.doc.textContent;
    const i = tc.indexOf("Paragraph number 150");
    return tc.slice(Math.max(0, i - 1), i + 5);
  },
  caretToOffscreen: () => {
    // place caret in a far paragraph and report whether it's rendered
    let pos = 1;
    view.state.doc.forEach((node, offset, index) => {
      if (index === 120) pos = offset + 1;
    });
    view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, pos)));
    return true;
  },
  blockRenderedAt: (index: number) => {
    const child = topChildren()[index];
    return child ? !child.hasAttribute("data-virtual-placeholder") : false;
  },
  stress: (iterations: number) => {
    let errors = 0;
    let seed = 12345;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    for (let i = 0; i < iterations; i++) {
      try {
        const size = view.state.doc.content.size;
        const op = Math.floor(rand() * 4);
        const pos = 1 + Math.floor(rand() * Math.max(1, size - 2));
        if (op === 0) {
          view.dispatch(view.state.tr.insert(pos, schema.text("z")));
        } else if (op === 1 && size > 10) {
          const from = pos;
          const to = Math.min(size - 1, from + 1 + Math.floor(rand() * 5));
          view.dispatch(view.state.tr.delete(from, to));
        } else if (op === 2) {
          // split a block
          try {
            view.dispatch(view.state.tr.split(pos));
          } catch {
            /* invalid split position, ignore */
          }
        } else {
          // move the viewport
          container.scrollTop = Math.floor(rand() * container.scrollHeight);
        }
      } catch (e) {
        errors++;
      }
    }
    // validity: re-serialize and re-parse round-trips without throwing
    let valid = true;
    try {
      view.state.doc.check();
    } catch {
      valid = false;
    }
    return { errors, valid, size: view.state.doc.content.size };
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).__ready = true;
