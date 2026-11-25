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

import { DOMParser } from "linkedom";
import { describe, expect, it } from "vitest";
import { cloneNode } from "../src/clone.js";

function parseBody(html: string): HTMLElement {
  const document = new DOMParser().parseFromString(
    `<!doctype html><html><body>${html}</body></html>`,
    "text/html"
  );
  return document.body as unknown as HTMLElement;
}

describe("cloneNode", () => {
  it("removes script and noscript elements", () => {
    const body = parseBody(
      `<p>hello</p><script>evil()</script><noscript>fallback</noscript>`
    );
    const clone = cloneNode(body, {});
    expect(clone.querySelector("script")).toBeNull();
    expect(clone.querySelector("noscript")).toBeNull();
    expect(clone.textContent).toContain("hello");
  });

  it("strips event-handler attributes from descendant elements", () => {
    const body = parseBody(
      `<svg onload="evil()"><a href="#" onclick="evil()">x</a></svg><img onerror="evil()"/><details ontoggle="evil()"></details>`
    );
    const clone = cloneNode(body, { images: true });
    for (const element of [clone, ...Array.from(clone.querySelectorAll("*"))]) {
      for (const attribute of Array.from(element.attributes)) {
        expect(attribute.name.toLowerCase().startsWith("on")).toBe(false);
      }
    }
  });

  it("strips an event-handler attribute set on the root node itself", () => {
    const body = parseBody(`<p>hello</p>`);
    body.setAttribute("onmouseover", "evil()");
    const clone = cloneNode(body, {});
    expect(clone.getAttribute("onmouseover")).toBeNull();
  });

  it("keeps ordinary, non-handler attributes intact", () => {
    const body = parseBody(`<a href="https://example.com" title="ok">x</a>`);
    const clone = cloneNode(body, {});
    const link = clone.querySelector("a");
    expect(link?.getAttribute("href")).toBe("https://example.com");
    expect(link?.getAttribute("title")).toBe("ok");
  });
});
