# TinyMCE Plugins

_Maintained by Streetwriters team_

All of these plugins are being used in [Notesnook](https://notesnook.com/) in production.

## Installation

```
yarn add @streetwriters/tinymce-plugins
```

### Usage

```jsx
import "@streetwriters/tinymce-plugins/<plugin-name>";
```

## Plugins

### Custom

1. Checklist
2. Inline codeblock (with syntax highlighting using `highlight.js`)
3. Inline code (`<code>some</code>`)
4. Shortcuts (for auto enclosing brackets, quotes, etc.)
5. Quickimage (for directly embedding local file images)
6. Collapsible Headers
7. Keyboard quirks
   - These includes various workarounds for quirks with keyboard input
8. Blockescape (for easily escaping from blockquote and other block elements)
9. Attachments handler (used internally by [Notesnook](https://app.notesnook.com/) for attachments)
10. Content handler (used internally by [Notesnook](https://app.notesnook.com/) to get html content & count words fast).
11. Bettertable (augments the default TinyMCE table adding row/cell selection, cell-only select all).

### Overrides

_Modifications details inside each plugin code._

1. Shortlink
2. Paste

## License

All these plugins (excluding TinyMCE mods) are licensed under MIT. Use them as you want. Attributions welcome.
