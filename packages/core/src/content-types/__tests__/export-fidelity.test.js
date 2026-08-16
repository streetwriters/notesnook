import { Tiptap } from "../tiptap.ts";
import { test, expect } from "vitest";

test("bug1: preserves double space after sentence end in markdown export", () => {
  const html =
    '<p data-spacing="double">at half past four.  Nobody came to the door</p>';
  const md = new Tiptap(html).toMD();
  expect(md).toContain("four.  Nobody");
  expect(md).not.toContain("four.Nobody");
});

test("bug2: preserves space after inline emphasis in markdown export", () => {
  const html = '<p data-spacing="double">The map was <em>almost</em> right</p>';
  const md = new Tiptap(html).toMD();
  expect(md).toMatch(/\*almost\* right/);
  expect(md).not.toMatch(/\*almost\*right/);
});

test("bug3: preserves mid-line spaces and leading indentation in txt export", () => {
  const html =
    '<p data-spacing="double">IF gate = open</p><p data-spacing="double">   AND dog = gone</p><p data-spacing="double">      ELSE note = under the stone</p>';
  const txt = new Tiptap(html).toTXT();
  expect(txt).toContain("under the stone");
  expect(txt).not.toContain("underthe");
  expect(txt).toMatch(/AND dog = gone/);
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
