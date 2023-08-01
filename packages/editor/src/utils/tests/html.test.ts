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

import { test } from "vitest";
import { convertBrToParagraph } from "../html";

const cases = [
  [
    `<p>line 1<br>line 2</p>`,
    `<p data-spacing="single">line 1</p><p data-spacing="single">line 2</p>`
  ],
  [
    `<p>line <em>1<br>line</em> 2</p>`,
    `<p data-spacing="single">line <em>1</em></p><p data-spacing="single"><em>line</em> 2</p>`
  ],
  [
    `<p>line <span><em>1<br>line</em></span> 2</p>`,
    `<p data-spacing="single">line <span><em>1</em></span></p><p data-spacing="single"><span><em>line</em></span> 2</p>`
  ],
  [
    `<p>line <span><em>1<br data-some="hello">line</em></span> 2</p>`,
    `<p data-spacing="single">line <span><em>1</em></span></p><p data-spacing="single"><span><em>line</em></span> 2</p>`
  ],
  [`<p><br/></p>`, `<p><br></p>`],
  [
    `<html><body>
    <!--StartFragment--><p dir="auto">When I try to paste something (e.g. email content) to a note, the styling is kept, which is good, but the newlines are removed.<br>
    Also when I share the selection to Notesnook via the share functionality from Android, I have the same issue.</p>
    <hr>
    <p dir="auto"><strong>Device information:</strong><br>
    App version: 2.3.0<br>
    Platform: android<br>
    Model: OnePlus-CPH2409-31<br>
    Pro: true<br>
    Logged in: yes</p><!--EndFragment-->
    </body>
    </html>`,
    `<!--StartFragment--><p dir="auto" data-spacing="single">When I try to paste something (e.g. email content) to a note, the styling is kept, which is good, but the newlines are removed.</p><p data-spacing="single">
    Also when I share the selection to Notesnook via the share functionality from Android, I have the same issue.</p>
    <hr>
    <p dir="auto" data-spacing="single"><strong>Device information:</strong></p><p data-spacing="single">
    App version: 2.3.0</p><p data-spacing="single">
    Platform: android</p><p data-spacing="single">
    Model: OnePlus-CPH2409-31</p><p data-spacing="single">
    Pro: true</p><p data-spacing="single">
    Logged in: yes</p><!--EndFragment-->`
  ]
];

for (const testCase of cases) {
  const [html, expected] = testCase;
  test(`convert br tags to paragraphs (${testCase})`, (t) => {
    t.expect(convertBrToParagraph(html).body.innerHTML.trim()).toBe(
      expected.trim()
    );
  });
}
