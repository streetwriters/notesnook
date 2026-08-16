import { Tiptap } from "../tiptap.ts";
import { test, expect } from "vitest";

test("bug1: preserves double space after sentence end in markdown export", () => {
  const html =
    '<p data-spacing="double">at half past four.  Nobody came to the door</p>';
  const md = new Tiptap(html).toMD();
  expect(md).toContain("four.  Nobody");
  expect(md).not.toContain("four.Nobody");
});

test("bug1 entity shape: preserves nbsp spacing after sentence end", () => {
  const html =
    '<p data-spacing="double">at half past four.&nbsp;&nbsp;Nobody came to the door</p>';
  const md = new Tiptap(html).toMD();
  expect(md).toContain("four.  Nobody");
  expect(md).not.toContain("four.Nobody");
});

test("bug2: preserves space after inline emphasis in markdown export", () => {
  const html =
    '<p data-spacing="double">The map was <em>almost</em>&#160;right</p>';
  const md = new Tiptap(html).toMD();
  expect(md).toMatch(/\*almost\* right/);
  expect(md).not.toMatch(/\*almost\*right/);
});

test("bug3: preserves mid-line spaces and leading indentation in markdown export", () => {
  const html =
    '<p data-spacing="double">IF gate = open</p><p data-spacing="double">&nbsp;&nbsp;&nbsp;AND dog = gone</p><p data-spacing="double">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ELSE note = under&nbsp;the stone</p>';
  const md = new Tiptap(html).toMD();
  expect(md).toContain("under the stone");
  expect(md).not.toContain("underthe");
  expect(md).toMatch(/   AND dog = gone/);
  expect(md).toMatch(/      ELSE note = under the stone/);
});

test("bug4: does not append closing tags for angle-bracket notation in markdown export", () => {
  const html =
    '<p data-spacing="double">Compare the <alpha> form against the <beta> form before deciding.</p>';
  const md = new Tiptap(html).toMD();
  expect(md).not.toContain("</beta>");
  expect(md).not.toContain("</alpha>");
  expect(md).toMatch(/<alpha/i);
});

test("bug5: does not turn bracket-paren notation into markdown links", () => {
  const html =
    '<p data-spacing="double">Record it as [type A] (the older casting), not as [type B].</p>';
  const md = new Tiptap(html).toMD();
  expect(md).not.toMatch(/\[type A\]\(the older casting\)/);
  expect(md).toMatch(/\[type A.*the older casting/);
});

test("bug11: preserves deliberate nbsp gaps from stored HTML", () => {
  const html = "<p>a deliberate&#160;&#160;&#160; gap between words</p>";
  const md = new Tiptap(html).toMD();
  expect(md).toMatch(/deliberate\s{3,}\s*gap/);
  expect(md).not.toMatch(/deliberate gap/);
});

test("audio attachments keep raw html in markdown export", () => {
  const html =
    '<p>clip</p><audio data-hash="h1" src="x.mp3" controls></audio>';
  const md = new Tiptap(html).toMD();
  expect(md).toContain("<audio");
  expect(md).not.toContain("&lt;audio");
});
