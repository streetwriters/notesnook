# @notesnook/editor-native

`NotesnookEditor`: the native Notesnook editor (`RichTextView` from the
[native-editor](https://github.com/streetwriters/native-editor) repository,
backed by a QuickJS ProseMirror engine) as a react-native-gpui host component.
It is a native view, not a webview.

```tsx
import NotesnookEditor, { NotesnookEditorHandle } from "@notesnook/editor-native";

const ref = useRef<NotesnookEditorHandle>(null);

<NotesnookEditor
  ref={ref}
  readonly={false}
  theme={themeTokens} // object, sent as JSON
  settings={{ /* view settings, name -> boolean */ }}
  onQueryResults={({ revision, changed }) => {}}
  onContentChange={({ revision }) => {}}
  onSave={({ revision, html }) => {}} // debounced 500 ms after an edit
  onHostAction={({ kind, payload }) => {}}
  onAttachmentRequest={({ id, hash, mime, url }) => {}}
/>;

ref.current?.setContent("<p>hello</p>");
ref.current?.setQueries([{ key: "bold", kind: "isActive", args: ["bold"] }]);
ref.current?.run([{ name: "toggleBold" }]);
```

| Props | |
|---|---|
| `readonly` | Turns editing off. |
| `sessionId` | Accepted; reserved for per-note state reset (no effect yet). |
| `theme`, `settings` | Objects, JSON-encoded over the codegen boundary. Settings are boolean view settings. |

| Commands (ref) | |
|---|---|
| `setContent(html)` | Loads a document. |
| `run(commands)` | Runs editor commands. |
| `setQueries(queries)` | Subscribes to query results (including `statistics` and `headings`), delivered through `onQueryResults`. |
| `focus(position?)` | Focuses the view (`start`/`end` placement is not implemented yet). |
| `requestSave()` | Emits `onSave` now (commands cannot return values). |
| `attachmentReady(id, path?)` | Answers an `onAttachmentRequest` with a file path; no path means failure. |

## Using it from an app

Add the package as a dependency; `react-native-gpui autolink` picks up
`react-native.config.js` and the `rn-gpui-notesnook-editor` crate in `desktop/`.
The crate depends on `editor-core` and `host-quickjs` from the native-editor
repository (git dependency), and must build with the same gpui-fast revision as
the app.

Not in the component yet: embeds and webviews, spell check and the HTTP client
(desktop-native plan items 5.4 and 5.5).
