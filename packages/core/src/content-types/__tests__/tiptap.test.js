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
  IMG_CONTENT,
  IMG_CONTENT_WITHOUT_HASH
} from "../../../__tests__/utils/index.ts";
import { Tiptap } from "../tiptap.ts";
import { test, expect } from "vitest";

test("img src is empty after extract attachments", async () => {
  const tiptap = new Tiptap(IMG_CONTENT_WITHOUT_HASH);
  const result = await tiptap.postProcess(async () => {
    return "helloworld";
  });
  expect(result.hashes).toHaveLength(1);
  expect(result.data).not.toContain(`src="data:image/png;`);
  expect(result.data).not.toContain(`src=""`);
  expect(result.data).toContain(`data-hash="helloworld"`);
});

test("img src is present after insert attachments", async () => {
  const tiptap = new Tiptap(IMG_CONTENT);
  const result = await tiptap.postProcess(async () => {
    return { key: "hello", metadata: {} };
  });
  const tiptap2 = new Tiptap(result.data);
  const result2 = await tiptap2.insertMedia((hashes) => {
    const images = {};
    for (const hash of hashes) {
      images[hash] = "i am a data";
    }
    return images;
  });
  expect(result2).toContain(`src="i am a data"`);
});

test("remove attachments with particular hash", async () => {
  const tiptap = new Tiptap(IMG_CONTENT);
  const result = tiptap.removeAttachments(["d3eab72e94e3cd35"]);
  expect(result).not.toContain(`d3eab72e94e3cd35`);
});

const HTMLS = {
  tables: `<table style="border-collapse: collapse; width: 811px;" border="1"><tbody><tr><td style="width: 81.375px;">Goal</td><td style="width: 708.625px;">To introduce various features of the app to the user and to convert a user on trial or basic plan to upgrade.</td></tr><tr><td style="width: 81.375px;">Frequency</td><td style="width: 708.625px;">1/week or 2/week</td></tr><tr><td style="width: 81.375px;">Types</td><td style="width: 708.625px;">Feature intro, upgrade promo, one time emails</td></tr><tr><td style="width: 81.375px;"></td><td style="width: 708.625px;"></td></tr></tbody></table><h2>Emails</h2><h3>Feature intro</h3><p>Features:</p><ol style="list-style-type: decimal;"><li>Web clipper on mobile</li><li>Pin any note to notification</li><li>Take notes from notifications</li><li>App lock</li><li>Importer</li><li>Encrypted attachments</li><li>Session history &amp; automatic backups</li><li>Note publishing</li><li>Note exports</li><li>Collapsible headers</li></ol><h3>Promos</h3><ol style="list-style-type: decimal;"><li>Trial about to end</li><li>Trial ending (with option to request an extension)</li><li>Try free for 14 days</li></ol><h3>One time</h3><ol style="list-style-type: decimal;"><li>End-of-month progress report</li><li>What's coming/roadmap</li><li>What we are working on</li><li>Join the community</li></ol>`,
  tables2: `<h1>Note 8/6/22, 10:48 AM</h1>
  <p  data-spacing="double">hell</p><p  data-spacing="double">what</p><table><tbody><tr><th colspan="1" rowspan="1"><p  data-spacing="double">sdsdavav</p></th><th colspan="1" rowspan="1"><p  data-spacing="double">daskvjbdsva</p></th><th colspan="1" rowspan="1"><p  data-spacing="double">vsadjkvsadbvjk</p></th></tr><tr><td colspan="1" rowspan="1"><p  data-spacing="double">dsvsajkdb</p></td><td colspan="1" rowspan="1"><p  data-spacing="double">dskajvbsadj</p></td><td colspan="1" rowspan="1"><p  data-spacing="double">kjdasvbkj</p></td></tr><tr><td colspan="1" rowspan="1"><p  data-spacing="double">daskvbkdsa</p></td><td colspan="1" rowspan="1"><p  data-spacing="double">kdsajvbsajkd</p></td><td colspan="1" rowspan="1"><p  data-spacing="double">kjdsavbdsa</p></td></tr></tbody></table>`,
  codeblocks: `<p>Typescript is one of those languages that appear to be very simple. It's often described as "Javascript with types" and it fits that name very well. However, what many don't realize starting out with Typescript is that Typescript&nbsp;<em>is </em>a language and like all other languages it has it's own "secrets", it's own set of quirks.</p><p>When I started out with Typescript a few years back, I absolutely hated it. It was unnecessary, a box of clutter, making me write code that would never actually run. I hated defining interfaces, typing out all my functions, and thinking in terms I was not used to as a Javascript developer. Before Javascript, I had coded in C# and I had never really liked C# (I still don't) mostly for the huge amounts of boilerplate and magic involved. Typescript is heavily inspired by C# and seeing that contaminate the Javascript ecosystem irked me no end.</p><p>That was all just fluff. Typescript is a great language solving a considerable amount of problems for a huge amount of developers. And generics is the hidden weapon behind it all.</p><h2>Understanding Typescript generics</h2><p>For all points and purposes, generics shouldn't exist. They are one of the main factors behind abysmal code readability. But in the right hands, generics turn into a super-weapon.</p><p>The main problem generics try to solve is how to take in multiple types of parameters. This is a solved problem but requires duplicating your functions or using conditions to separate out different logic for different types. That is essentially what generics do as well but hidden from human eyes.</p><p>Think of a container that can take any type of item as long as it is not a circle. In Javascript, this becomes a problem you have to solve at runtime with checks &amp; conditions:</p><pre data-indent-type="space" data-indent-length="2" class="language-javascript"><code>var container = [];\nfunction putIntoContainer(item) {\n    if (item.type === "round") throw new Error("Rounded items not supported.")\n    container.push(item);\n}\n\nvar square = {type: "square"}\nvar circle = {type: "round"}\nputIntoContainer(square)\nputIntoContainer(circle) // ERROR! Rounded items not supported!\n</code></pre><p>There are many ways to solve this problem and some are even practical. The issue here isn't of repetition but of doing unnecessary work. Type safe languages would automatically give an error if there was a wrong type but Javascript knows nothing about the <code>item</code>.</p><p>In Typescript, this will be solved much more succinctly:</p><pre data-indent-type="space" data-indent-length="2" class="language-typescript"><code>// first define the types of items we'll handle\n// i.e. we don't want to handle any item other\n// than square or round.\n// This gives us nice auto completion and safety\n// against typos.\ntype ItemTypes = "square" | "round";\n\n// Define a generic item that can be of any type\n// defined in ItemTypes.\n// i.e. Item&lt;"triangle"&gt; will give an error.\ntype Item&lt;TItemType extends ItemTypes&gt; = {\n type?: TItemType;\n width: number;\n height: number;\n};\n\n// This is just syntax sugar to increase readability.\ntype Square = Item&lt;"square"&gt;;\ntype Circle = Item&lt;"round"&gt;;\n\n// Our container is just a simple wrapper around an array\n// that accepts items of only a specific type.\ntype Container&lt;TItemType extends ItemTypes&gt; = Array&lt;Item&lt;TItemType&gt;&gt;;\n\nvar squareContainer: Container&lt;"square"&gt; = [];\nvar roundContainer: Container&lt;"round"&gt; = [];\n\n// This wrapper is unnecessary, of course, because array.push\n// already does this. Only for demonstration purposes.\nfunction putIntoContainer&lt;\n TItemType extends ItemTypes,\n TItem extends Item&lt;TItemType&gt;\n&gt;(container: Container&lt;TItemType&gt;, item: TItem) {\n container.push(item);\n}\n\nvar square: Square = { width: 100, height: 200 };\nvar circle: Circle = { width: 200, height: 500 };\n\nputIntoContainer(squareContainer, square);\nputIntoContainer(roundContainer, circle);\nputIntoContainer(roundContainer, square); // Error: Argument of type 'Square' is not assignable to parameter of type 'Item&lt;"round"&gt;'.\nputIntoContainer(squareContainer, circle); // Error: Argument of type 'Circle' is not assignable to parameter of type 'Item&lt;"square"&gt;'.\n</code></pre><p>A lot more code, I know, and if you don't know how generics work that blob of code is utter nonsense. One of the main reasons I avoided Typescript for a long time. But look at the benefits:</p><ol style="list-style-type: decimal"><li><p >You have 100% compile-time type safety.</p></li><li><p >You can't put a round item in a square container (you will get compiler error).</p></li><li><p >You didn't write any extra runtime code.</p></li></ol><p>Expanding on point #3, after transpilation the above code will turn more-or-less into:</p><pre data-indent-type="space" data-indent-length="2" class="language-javascript"><code>var squareContainer = [];\nvar roundContainer = [];\n\nfunction putIntoContainer(container, item) {\n container.push(item);\n}\n\nvar square = { width: 100, height: 200 };\nvar circle = { width: 200, height: 500 };\n\nputIntoContainer(squareContainer, square);\nputIntoContainer(roundContainer, circle);\n</code></pre><p>This is the power of generics. More specifically, this is Typescript generics at a glance.</p><p>But this post was supposed to be about the "Secrets" of Typescript Generics, right? Well, let's get into that.</p><h2>1. Type filters using ternary operators</h2><h2>2. Deeply recursive types</h2><h2>3. Type functions</h2><h2>4. Type inference using interface properties</h2>`,
  tasklists: `<p>Hello</p><ul data-collapsed="false" class="checklist"><li class="checked checklist--item"><p>Task item 1</p></li><li class="checked checklist--item"><p>Task item 2</p></li><li class="checked checklist--item"><p>Task item 3</p></li><li class="checklist--item"><p>Task item 4</p><ul data-collapsed="false" class="checklist"><li class="checklist--item"><p>Sub task item 1</p></li><li class="checklist--item"><p>Sub task item 2</p></li></ul></li><li class="checklist--item"><p>Task Item 5</p></li></ul><p>Nene</p><ul><li><p>dasvsadv</p></li><li><p>adsva\`sd</p></li><li><p>vasd</p></li><li><p>vsadvdsa</p></li></ul>`,
  outlinelists: `<p >Testing outline list:</p><ul data-collapsed="false" data-type="outlineList"><li data-type="outlineListItem"><p >My outline list</p></li><li data-type="outlineListItem"><p >works</p></li><li data-type="outlineListItem"><p >but sometimes</p><ul data-collapsed="false" data-type="outlineList"><li data-type="outlineListItem"><p >It doesn't</p></li><li data-type="outlineListItem"><p >what do I do?</p></li><li data-type="outlineListItem"><p >I need to do something!</p></li></ul></li><li data-type="outlineListItem"><p >Makes no sense!</p></li><li data-type="outlineListItem"><p >Yes it doesn't!</p></li></ul>`,
  codeblock2: `<pre>hello<br></pre>`,
  singleSpacedParagraphs: `<p data-spacing="single">hello world</p><p data-spacing="single">hello world 2</p>`
};

for (const html in HTMLS) {
  test(`convert HTML to markdown with ${html}`, () => {
    const tiptap = new Tiptap(HTMLS[html]);
    expect(tiptap.toMD()).toMatchSnapshot(`html-to-md-${html}.md`);
  });
}

for (const html in HTMLS) {
  test(`convert HTML to text with ${html}`, () => {
    const tiptap = new Tiptap(HTMLS[html]);
    expect(tiptap.toTXT()).toMatchSnapshot(`html-to-txt-${html}.txt`);
  });
}
