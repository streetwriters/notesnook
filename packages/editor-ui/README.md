# @notesnook/editor-ui

The editor's UI layer, split out of `@notesnook/editor`: the toolbar (tools, popups, groups, stores), shared components (button, resizer, tabs, action sheet, popup presenter), hooks (`useEditor`, `usePermissionHandler`, …), editor queries, and the helpers they need.

## Layering

`@notesnook/editor` depends on `@notesnook/editor-ui`, never the other way round. The UI refers to nodes and marks by name (`NODE_NAMES`) and to editor-only behaviour through small registries (`registerTableActions`), so it never imports an extension.

`@notesnook/editor` re-exports this package's barrel (`export * from "@notesnook/editor-ui"`), so existing `@notesnook/editor` imports keep working.

## Usage

Import from the package root only (the repo's `moduleResolution: node` ignores the `exports` map):

```ts
import { Toolbar, useEditor, useToolbarStore } from "@notesnook/editor-ui";
```

Deep `dist/cjs/...` imports are used by `apps/mobile` for plain data (`toolbar/tool-definitions`, `toolbar/icons`, `utils/font`).

## Not done yet

Components still use `theme-ui` and `@notesnook/ui`; moving them onto the `@ui` contracts is a follow-up.

## Scripts

- `npm run tsc`: type-check
- `npm run build`: build `dist/` (cjs, esm, types)
