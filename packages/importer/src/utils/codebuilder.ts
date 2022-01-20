export function buildCodeBlock(value: string, language: string) {
  return `<pre class="hljs language-${language}">
    ${value}
  </pre>`;
}
