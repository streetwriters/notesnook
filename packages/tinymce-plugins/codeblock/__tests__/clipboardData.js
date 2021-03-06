const clipboardData = [
  {
    name: "brush-js",
    formats: [
      createFormat(
        "text/html",
        `<pre class="brush: js notranslate"><code><span class="token function">cloneNode</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token function">cloneNode</span><span class="token punctuation">(</span>deep<span class="token punctuation">)</span><span class="token punctuation">;</span>
</code></pre>`
      ),
    ],
    selector: ".hljs.language-javascript",
    headless: true,
  },
  {
    name: "hljs-language-objectivec",
    formats: [
      createFormat(
        "text/html",
        `<pre><code class="hljs language-objectivec"><span class="hljs-built_in">CMake</span> Error at <span class="hljs-built_in">CMakeLists</span>.txt:<span class="hljs-number">84</span> (install):
  install FILES given no DESTINATION!
</code></pre>`
      ),
    ],
    selector: ".hljs.language-objectivec",
    headless: true,
  },
  {
    name: "github",
    formats: [
      createFormat(
        "text/html",
        `<table class="highlight tab-size js-file-line-container js-code-nav-container js-tagsearch-file" data-tab-size="8" data-paste-markdown-skip="" data-tagsearch-lang="JavaScript" data-tagsearch-path="pbcopy.js">
    <tbody><tr>
      <td id="file-pbcopy-js-L1" class="blob-num js-line-number js-code-nav-line-number js-blob-rnum" data-line-number="1"></td>
      <td id="file-pbcopy-js-LC1" class="blob-code blob-code-inner js-file-line"><span class="pl-k">function</span> <span class="pl-en">pbcopy</span><span class="pl-kos">(</span><span class="pl-s1">data</span><span class="pl-kos">)</span> <span class="pl-kos">{</span></td>
    </tr>
    <tr>
      <td id="file-pbcopy-js-L2" class="blob-num js-line-number js-code-nav-line-number js-blob-rnum" data-line-number="2"></td>
      <td id="file-pbcopy-js-LC2" class="blob-code blob-code-inner js-file-line">  <span class="pl-k">var</span> <span class="pl-s1">proc</span> <span class="pl-c1">=</span> <span class="pl-en">require</span><span class="pl-kos">(</span><span class="pl-s">'child_process'</span><span class="pl-kos">)</span><span class="pl-kos">.</span><span class="pl-en">spawn</span><span class="pl-kos">(</span><span class="pl-s">'pbcopy'</span><span class="pl-kos">)</span><span class="pl-kos">;</span></td>
    </tr>
    <tr>
      <td id="file-pbcopy-js-L3" class="blob-num js-line-number js-code-nav-line-number js-blob-rnum" data-line-number="3"></td>
      <td id="file-pbcopy-js-LC3" class="blob-code blob-code-inner js-file-line">  <span class="pl-s1">proc</span><span class="pl-kos">.</span><span class="pl-c1">stdin</span><span class="pl-kos">.</span><span class="pl-en">write</span><span class="pl-kos">(</span><span class="pl-s1">data</span><span class="pl-kos">)</span><span class="pl-kos">;</span></td>
    </tr>
    <tr>
      <td id="file-pbcopy-js-L4" class="blob-num js-line-number js-code-nav-line-number js-blob-rnum" data-line-number="4"></td>
      <td id="file-pbcopy-js-LC4" class="blob-code blob-code-inner js-file-line">  <span class="pl-s1">proc</span><span class="pl-kos">.</span><span class="pl-c1">stdin</span><span class="pl-kos">.</span><span class="pl-en">end</span><span class="pl-kos">(</span><span class="pl-kos">)</span><span class="pl-kos">;</span></td>
    </tr>
    <tr>
      <td id="file-pbcopy-js-L5" class="blob-num js-line-number js-code-nav-line-number js-blob-rnum" data-line-number="5"></td>
      <td id="file-pbcopy-js-LC5" class="blob-code blob-code-inner js-file-line"><span class="pl-kos">}</span></td>
    </tr>
</tbody></table>`
      ),
    ],
    headless: true,
    selector: ".hljs.language-javascript",
  },
  {
    name: "vscode",
    formats: [
      createFormat(
        "text/html",
        `<meta http-equiv="content-type" content="text/html; charset=utf-8"><div style="color: #000000;background-color: #ffffff;font-family: 'Droid Sans Mono', 'monospace', monospace;font-weight: normal;font-size: 14px;line-height: 19px;white-space: pre;"><div><span style="color: #000000;">    </span><span style="color: #0000ff;">const</span><span style="color: #000000;"> </span><span style="color: #0070c1;">isGithub</span><span style="color: #000000;"> =</span></div><div><span style="color: #000000;">      </span><span style="color: #001080;">childNode</span><span style="color: #000000;">.</span><span style="color: #001080;">classList</span><span style="color: #000000;"> &amp;&amp;</span></div><div><span style="color: #000000;">      </span><span style="color: #001080;">childNode</span><span style="color: #000000;">.</span><span style="color: #001080;">classList</span><span style="color: #000000;">.</span><span style="color: #795e26;">contains</span><span style="color: #000000;">(</span><span style="color: #a31515;">"highlight"</span><span style="color: #000000;">) &amp;&amp;</span></div><div><span style="color: #000000;">      </span><span style="color: #001080;">childNode</span><span style="color: #000000;">.</span><span style="color: #795e26;">hasAttribute</span><span style="color: #000000;">(</span><span style="color: #a31515;">"data-tagsearch-lang"</span><span style="color: #000000;">);</span></div></div> `
      ),
      createFormat(
        "text/plain",
        `      const isGithub =
        childNode.classList &&
        childNode.classList.contains("highlight") &&
        childNode.hasAttribute("data-tagsearch-lang");`
      ),
      createFormat(
        "vscode-editor-data",
        JSON.stringify({
          version: 1,
          isFromEmptySelection: false,
          multicursorText: null,
          mode: "javascript",
        })
      ),
    ],
    selector: ".hljs.language-javascript",
    headless: false,
  },
];

function createFormat(type, data) {
  return { type, data };
}

module.exports = { clipboardData };
