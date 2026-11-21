# @notesnook/editor-ui

The editor's UI layer, split out of `@notesnook/editor`: the toolbar (tools, popups, groups, stores), shared components (button, resizer, tabs, action sheet, popup presenter), hooks (`useEditor`, `usePermissionHandler`, …), editor queries, and the helpers they need.

## Layering

`@notesnook/editor` depends on `@notesnook/editor-ui`, never the other way round. The UI refers to nodes and marks by name (`NODE_NAMES`) and to editor-only behaviour through small registries (`registerTableActions`), so it never imports an extension.

`@notesnook/editor` re-exports this package's barrel (`export * from "@notesnook/editor-ui"`), so existing `@notesnook/editor` imports keep working.

## Reading and changing the editor

Tools, popups and floating menus talk to an `EditorController`, never to Tiptap: they read with queries (`useControllerQuery(editor, q.isActive("link"))`) and change the document with `editor.run({ name, args })`. A new query goes in `queries/queries.ts` with a Tiptap evaluator in `queries/store.ts` and a native one in native-editor's `src/engine/host-api.ts`; a new command is a Tiptap command plus an engine command of the same name.

Values that move with every caret step (`selectionOffset`, `selectedText`, `selection`) are read when a button is pressed (`useControllerQueryReader`), not subscribed to, so a caret move between plain paragraphs re-renders no tool (`packages/editor/src/__tests__/render-count.test.ts`). Only the Tiptap engine renders DOM, so `posAtElement` (hover popups) is optional on the controller.

## Usage

Import from the package root only (the repo's `moduleResolution: node` ignores the `exports` map):

```ts
import { Toolbar, useEditor, useToolbarStore } from "@notesnook/editor-ui";
```

Deep `dist/cjs/...` imports are used by `apps/mobile` for plain data (`toolbar/tool-definitions`, `toolbar/icons`, `utils/font`). `apps/desktop-native` reads the same data (`toolbar-data`, `toolbar/tool-definitions`) through re-exports in `src/app/common/toolbar-*.ts`, and its `toolbar-data.test.ts` loads the `dist/cjs` files by those deep paths, so the tool list, icons and presets have one source.

## UI primitives and popup positioning

Components import their primitives and theming from the `@ui` contracts, not from `theme-ui`, `@notesnook/ui` or emotion.

Popups (`ResponsivePresenter`, `PopupWrapper`, `showPopup`) take one of:

- `editor` + `anchor`: the popup sits next to content, from the `q.anchor` query. `anchor` is `"selection"`, `{ node: "image" }` or `{ range: { from, to } }` (document positions). The position follows the document, on Tiptap and on the native editor alike (a `range` falls back to the caret on the native editor).
- `anchorRef`: the popup sits next to a toolbar control (dropdowns, more-tools, colors, lists, block and table menus).
- `anchorRect`: a window rect the caller measured itself. It wins over everything else.

`placement` picks the side and alignment (`"bottom-start"`, `"top-end"`, …). With none of these the popup sits under the toolbar. There is no `position` option, no `getBoundingClientRect` and no `"mouse"` target any more.

## Scripts

- `npm run tsc`: type-check
- `npm run build`: build `dist/` (cjs, esm, types)
