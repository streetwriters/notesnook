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
import {
  formatCodeblocks,
  convertBrToSingleSpacedParagraphs,
  convertGoogleDocsChecklist
} from "../clipboard-dom-parser.js";

const cases = [
  [`<p>line 1<br>line 2</p>`],
  [`<p>line <em>1<br>line</em> 2</p>`],
  [`<p>line <span><em>1<br>line</em></span> 2</p>`],
  [`<p>line <span><em>1<br data-some="hello">line</em></span> 2</p>`],
  [`<p><br/></p>`],
  [
    `
  <html><body>
<!--StartFragment-->A troll, they call me, but I have no wish<br>
to be associated with those dolls<br>
<br>
We lack religion, purpose, politics,<br>
and yet, we somehow manage to get by.<br>
</body>
</html>`
  ],
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
    </html>`
  ],
  [
    `<html><body>
    <!--StartFragment--><span class="css-901oao css-16my406 r-poiln3 r-bcqeeo r-qvutc0">Why switch from Gmail? 

    Not sacrificing features for more privacy, prefer using one app, in many public groups and channels (Telegram)
    
    LibreOffice Slow &amp; buggy
    
    Switched to Brave for the better Android app, more private out of the box &amp; unsure if uBlock Origin closes gap</span><!--EndFragment-->
    </body>
    </html>`
  ],
  [
    `<div>
  <p style="line-height: 100%; margin-bottom: 0in">
  I am not talk9ing to you</p>
  <p style="line-height: 100%; margin-bottom: 0in"><br>
  
  </p>
  <p style="line-height: 100%; margin-bottom: 0in">I am not talk9ing to
  you</p>
  
  </div>`
  ],
  [
    `<div>
  <p style="line-height: 100%; margin-bottom: 0in">
  I am not talking to you</p>
  <br/>
  <p>I am talking to you</p>
  </div>`
  ],
  [
    `<div>
    <!--StartFragment--><p><span>Hello</span></p><br><br><br><br><br><p><span >world</span></p><!--EndFragment-->
    
    </div>`
  ],
  [
    `<div>
    <!--StartFragment--><meta charset="utf-8"><h1><span >Write notes</span></h1><br><p dir="ltr" ><span >Welcome of </span><a><span >Notesnook</span></a><span >, an syncing.</span></p><br><p dir="ltr" ><span >Enjoy the read!</span></p><br><p dir="ltr" ><span ><span ><img></span></span></p><br><p dir="ltr" ><span >vision?</span></p><br><p dir="ltr" ><span >everyone means</span></p><!--EndFragment-->
    
    </div>`
  ],
  [
    `<ul xmlns="http://www.w3.org/1999/xhtml" data-block-id="A9jEKaAm" class="checklist"><li class="checklist--item"><a target="_blank" rel="noopener noreferrer nofollow" href="https://google.com">hello</a>hello <a target="_blank" rel="noopener noreferrer nofollow" href="https://google.com">hello</a><br /><a target="_blank" rel="noopener noreferrer nofollow" href="https://google.com">hello</a><br /><a target="_blank" rel="noopener noreferrer nofollow" href="https://google.com">hello</a><br /><a target="_blank" rel="noopener noreferrer nofollow" href="https://google.com">hello</a></li><li class="checklist--item"><a target="_blank" rel="noopener noreferrer nofollow" href="https://google.com">hello</a><br /><a target="_blank" rel="noopener noreferrer nofollow" href="https://google.com">hello</a><br /><a target="_blank" rel="noopener noreferrer nofollow" href="https://google.com">hello</a><br /><a target="_blank" rel="noopener noreferrer nofollow" href="https://google.com">hello</a></li><li class="checklist--item"><a target="_blank" rel="noopener noreferrer nofollow" href="https://google.com">hellohello</a><br /><a target="_blank" rel="noopener noreferrer nofollow" href="https://google.com">hello hello hello</a><br /><a target="_blank" rel="noopener noreferrer nofollow" href="https://google.com">hello</a><br /><a target="_blank" rel="noopener noreferrer nofollow" href="https://google.com">hello</a></li><li class="checklist--item">vsvdsavdsa</li><li class="checklist--item">vadsvasdv</li></ul><p xmlns="http://www.w3.org/1999/xhtml" data-block-id="CuscJzDm" data-spacing="double"></p>`
  ]
];

for (const testCase of cases) {
  const [html] = testCase;
  test(`convert br tags to paragraphs`, (t) => {
    const element = new DOMParser().parseFromString(html, "text/html");
    convertBrToSingleSpacedParagraphs(element);
    t.expect(element.body.innerHTML.trim()).toMatchSnapshot();
  });
}

const codeBlocks = [
  `<div>
  <!--StartFragment--><p>Sure! Here's an implementation of a word counter for Thai that considers each syllable consisting of a consonant sound followed by a vowel sound as a word:</p><pre><div class="bg-black rounded-md mb-4"><div class="flex items-center relative text-gray-200 bg-gray-800 px-4 py-2 text-xs font-sans justify-between rounded-t-md"><span>javascript</span></div></div></pre><pre><div class="bg-black rounded-md mb-4"><div class="p-4 overflow-y-auto"><code class="!whitespace-pre hljs language-javascript"><span class="hljs-keyword">function</span> <span class="hljs-title function_">countThaiWords</span>(<span class="hljs-params">text</span>) {
    <span class="hljs-comment">// define a regular expression to match Thai syllables</span>
    <span class="hljs-keyword">const</span> thaiSyllableRegex = <span class="hljs-regexp">/[\u0E01-\u0E3A\u0E40-\u0E5B]+[\u0E00-\u0E7F]?/g</span>;
  
    <span class="hljs-comment">// count the number of matches of the Thai syllable regex in the text</span>
    <span class="hljs-keyword">const</span> matches = text.<span class="hljs-title function_">match</span>(thaiSyllableRegex) || [];
    <span class="hljs-keyword">const</span> wordCount = matches.<span class="hljs-property">length</span>;
  
    <span class="hljs-comment">// return the number of words</span>
    <span class="hljs-keyword">return</span> wordCount;
  }
  
  <span class="hljs-comment">// example usage</span>
  <span class="hljs-keyword">const</span> text = <span class="hljs-string">"สวัสดีค่ะยินดีต้อนรับเข้าสู่โลกของฉัน"</span>;
  <span class="hljs-keyword">const</span> wordCount = <span class="hljs-title function_">countThaiWords</span>(text);
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">\`Word count: <span class="hljs-subst">\${wordCount}</span>\`</span>);
  <span class="hljs-comment">// output: Word count: 9</span>
  </code></div></div></pre><p>This implementation defines a regular expression to match Thai syllables, which are composed of one or more Thai characters. It then uses the <code>match</code> function of the <code>String</code> object to count the number of matches of the Thai syllable regex in the input text.</p><p>Note that this implementation assumes that each syllable consisting of a consonant sound followed by a vowel sound is considered a word in Thai. This may not always be accurate, as some words in Thai may consist of multiple syllables, and some syllables may be used as prefixes or suffixes to modify other words. However, this approach should work well for many cases where each syllable is considered a separate word.</p><!--EndFragment-->
  
  </div>`
];
for (const codeBlock of codeBlocks) {
  test(`properly format codeblocks`, (t) => {
    const element = new DOMParser().parseFromString(codeBlock, "text/html");
    formatCodeblocks(element);
    t.expect(element.body.innerHTML.trim()).toMatchSnapshot();
  });
}

const checkLists = [
  `<div>
    <!--StartFragment--><meta charset="utf-8"><ul  id="docs-internal-guid-0d9a5db3-7fff-ab55-e7ca-b178e1031970"><li dir="ltr" role="checkbox" aria-checked="false"  aria-level="1"><img    alt="unchecked" aria-roledescription="checkbox" ><p dir="ltr"  role="presentation"><span >Adsjkfhasdf</span></p></li><li dir="ltr" role="checkbox" aria-checked="false"  aria-level="1"><img    alt="unchecked" aria-roledescription="checkbox" ><p dir="ltr"  role="presentation"><span >Asdfsadf</span></p></li><li dir="ltr" role="checkbox" aria-checked="true"  aria-level="1"><img    alt="checked" aria-roledescription="checkbox" ><p dir="ltr"  role="presentation"><span >Asdfsda</span></p></li><li dir="ltr" role="checkbox" aria-checked="true"  aria-level="1"><img    alt="checked" aria-roledescription="checkbox" ><p dir="ltr"  role="presentation"><span >Fasd</span></p></li><li dir="ltr" role="checkbox" aria-checked="true"  aria-level="1"><img    alt="checked" aria-roledescription="checkbox" ><p dir="ltr"  role="presentation"><span >Fasd</span></p></li><li dir="ltr" role="checkbox" aria-checked="false"  aria-level="1"><img    alt="unchecked" aria-roledescription="checkbox" ><p dir="ltr"  role="presentation"><span >F</span></p></li><li dir="ltr" role="checkbox" aria-checked="true"  aria-level="1"><img    alt="checked" aria-roledescription="checkbox" ><p dir="ltr"  role="presentation"><span >akcasb</span></p></li><ul ><li dir="ltr" role="checkbox" aria-checked="true"  aria-level="2"><img    alt="checked" aria-roledescription="checkbox" ><p dir="ltr"  role="presentation"><span >Asdf</span></p></li><li dir="ltr" role="checkbox" aria-checked="false"  aria-level="2"><img    alt="unchecked" aria-roledescription="checkbox" ><p dir="ltr"  role="presentation"><span >Asdcasdc</span></p></li><li dir="ltr" role="checkbox" aria-checked="false"  aria-level="2"><img    alt="unchecked" aria-roledescription="checkbox" ><p dir="ltr"  role="presentation"><span >sdac</span></p></li></ul><li dir="ltr" role="checkbox" aria-checked="false"  aria-level="1"><img    alt="unchecked" aria-roledescription="checkbox" ><p dir="ltr"  role="presentation"><span >Asdfsda</span></p></li></ul><!--EndFragment-->
    
    </div>`
];
for (const checkList of checkLists) {
  test(`convert google docs checklist`, (t) => {
    const element = new DOMParser().parseFromString(checkList, "text/html");
    convertGoogleDocsChecklist(element);
    t.expect(element.body.innerHTML.trim()).toMatchSnapshot();
  });
}
