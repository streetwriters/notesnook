# Web target audit against the `@ui` contracts

Plan item 3.2 of "Shared editor UI and native editor in desktop-native".
Audited at commit `cb81efae2` (`src/ui/*.ts` against `src/targets/web/ui/*`).
This is a read-through audit plus the existing type-level check: no contract
file was edited, and no web code was changed by this audit.

## How to read it

- **Verdict**: `Conforms` means the web implementation satisfies the contract's
  types and every prop/handle member behaves as the contract describes.
  `Does not conform` means at least one contract member is ignored, throws, or is
  a placeholder. Smaller things that do not break the contract are listed as
  notes in the same row.
- Types always line up: `targets/web/ui/conformance.ts` assigns the whole web
  index to `typeof Contract`, so `npm run tsc:web` fails on a missing or
  mistyped export. Everything below is behaviour the type check cannot see.
- Contracts that are only types (`events.ts`, `style.ts`, the menu item types in
  `overlays.ts`, `type-tests.tsx`) are not listed; the web target consumes them
  (`use-dom.tsx`, `style/engine.ts`) and they have no runtime to audit.
- Not run in a browser for this audit. Behaviour claims come from reading the
  code; the "Needs a test page" column in the summary is what 3.2's test page
  should exercise.

## Verdicts

| # | Contract (`src/ui/…`) | Web file | Verdict |
| --- | --- | --- | --- |
| 1 | `primitives` Box, Flex | `primitives.tsx` | Conforms (note N1) |
| 2 | `primitives` Grid | `primitives.tsx` | Conforms |
| 3 | `primitives` Text | `primitives.tsx` | Conforms |
| 4 | `primitives` Label | `primitives.tsx` | Conforms |
| 5 | `primitives` Link | `primitives.tsx` | Conforms (note N2) |
| 6 | `primitives` Button | `primitives.tsx` | Conforms |
| 7 | `primitives` Image | `primitives.tsx` | Conforms |
| 8 | `primitives` Input | `primitives.tsx` | Conforms (note N3) |
| 9 | `primitives` Textarea | `primitives.tsx` | **Does not conform** (F1) |
| 10 | `primitives` Checkbox | `primitives.tsx` | Conforms (note N4) |
| 11 | `primitives` Radio | `primitives.tsx` | Conforms |
| 12 | `primitives` Select | `primitives.tsx` | Conforms (note N5) |
| 13 | `primitives` QRCode | `primitives.tsx` | **Does not conform** (F2) |
| 14 | `primitives` ColorPicker | `primitives.tsx` | **Does not conform** (F3) |
| 15 | `primitives` Switch | `primitives.tsx` | Conforms |
| 16 | `primitives` Slider | `primitives.tsx` | **Does not conform** (F4) |
| 17 | `primitives` Progress | `primitives.tsx` | Conforms |
| 18 | `primitives` Icon | `primitives.tsx` | Conforms |
| 19 | `primitives` ThemeScope | `theme.tsx` → `shared/theme.tsx` | Conforms (note N6) |
| 20 | `primitives` BaseProps event/drag/file props | `use-dom.tsx` | **Does not conform** (F5, F6) |
| 21 | `dialog` Dialog, DialogButton | `dialog.tsx` | **Does not conform** (F7, F8) |
| 22 | `layout` SplitPane, Pane | `layout.tsx` | Conforms (note N7) |
| 23 | `layout` ScrollContainer, LayoutRoot | `layout.tsx` | Conforms (note N8) |
| 24 | `layout` TitleBar, TITLE_BAR_HEIGHT | `layout.tsx` | Conforms (note N9) |
| 25 | `lists` VirtualList | `lists.tsx` | **Does not conform** (F9) |
| 26 | `lists` SortableList | `sortable-list.tsx` | **Does not conform** (F10) |
| 27 | `overlays` Popover, PopoverHost | `popover.tsx` | **Does not conform** (F11) |
| 28 | `overlays` showToast, ToastHost | `toast.tsx` | **Does not conform** (F12) |
| 29 | `overlays` DragGhostHost | `embeds.tsx` | Conforms |
| 30 | `hooks` useMediaQuery, matchMediaQuery, useWindowSize, getPointerPosition, useThemeColor | `hooks.ts` | Conforms (note N10) |
| 31 | `editor` EditorSurface, EditorHandle | `editor.tsx` | **Does not conform** (F13) |
| 32 | `pdf` PdfViewer | `embeds.tsx` | **Does not conform** (F14, placeholder) |
| 33 | `avatar-editor` AvatarEditor | `embeds.tsx` | **Does not conform** (F14, placeholder) |
| 34 | `webview` WebView | `embeds.tsx` | **Does not conform** (F15) |

Of 34 rows, 20 conform and 14 do not (9, 13, 14, 16, 20, 21, 25 to 28, 31 to 34).

## Non-conformances

Each names the contract it breaks and the web code that diverges.

### Primitives

- **F1 Textarea** (`primitives.ts` `TextareaProps`, which extends `InputProps`
  minus `type`/`onSubmit`). `selectTextOnFocus` is accepted and never read
  (`web/ui/primitives.tsx` Textarea, no `onFocus` handling, unlike Input).
  `rows` only auto-grows when it is exactly `1`; any other value is a fixed
  height.
- **F2 QRCode** (`QRCodeProps.logo`). `primitives.tsx` QRCode never reads `logo`,
  so a logo/padding request renders a plain code. Also: the PNG path draws the
  SVG through an `Image` and a canvas at `props.size` with no background fill,
  so `toPNG()` is transparent where the on-screen code has the theme
  background.
- **F3 ColorPicker** (`ColorPickerProps`). Implemented as a bare
  `<input type="color">`: no alpha, no themed popup, no keyboard model of its
  own, and the browser UI differs per engine. It satisfies the types and is a
  placeholder for the editor's colour popups, which need a hue/saturation/alpha
  picker (the desktop target has its own `color-picker.tsx`).
- **F4 Slider** (`SliderProps.variant`). `Slider` calls `useDom(props, {})` with
  no `variantGroup`, so `variant` is ignored and the control is the unthemed
  browser range input. `Progress` and `Select` share the same call but their
  contract has no `variant`, so only Slider breaks.
- **F5 BaseProps.onWheel** (`WheelEvent.preventDefault`). `use-dom.tsx` binds
  React's `onWheel`, which React attaches as a passive listener, so
  `preventDefault()` is a no-op and the page still scrolls.
- **F6 BaseProps drag and drop** (`onDragEnter/Leave`, `onDropFiles`).
  - `dragenter`/`dragleave` bubble from children, so `data-drag-over` and
    `onDragLeave` flicker when the pointer crosses a child (`use-dom.tsx`
    drag section). Native fires one enter and one leave per target.
  - A drop with files that all fail `acceptsFiles` falls through to `onDrop`
    with `payload: undefined`, which the contract never promises.
  - `toDroppedFile` creates an object URL per file and never revokes it.

### Dialog, lists, overlays

- **F7 Dialog layering** (project rule: targets implement contracts; they
  import nothing from `src/app`). `web/ui/dialog.tsx` imports `useEscape` from
  `app/hooks/use-escape` and `Close`, `Loading` from `app/components/icons`;
  `toast.tsx` imports icons from `app/components/icons` too. This blocks moving
  the web target into `packages/ui-kit` (3.1) and `editor-ui` (4.x).
- **F8 Dialog behaviour** (`DialogProps`). No `role="dialog"`, no
  `aria-modal`, no focus trap or focus restore; the backdrop is
  `position: absolute` inside `LayoutRoot`, not portalled, so a dialog opened
  inside a clipped or transformed ancestor is clipped. `DialogButtonProps.role`
  is passed to `Button` but `Button` never maps it to a DOM attribute.
- **F9 VirtualList** (`VirtualListProps`). It does not virtualise:
  `lists.tsx` renders all `count` items and relies on `content-visibility:
  auto`. `overscan` is ignored; `extraData` only toggles a `data-extra`
  attribute (items re-render on every parent render anyway);
  `ScrollToIndexOptions.animated` is ignored; `initialScrollIndex` runs once
  and only for a truthy index. Large lists scale linearly in DOM nodes.
- **F10 SortableList** (`SortableMove.group`). `onDrop` never compares
  `payload.group` with the target's group, so items from different groups can
  be dropped on each other, and it reports `index` of the drop target without
  accounting for the drag direction. Hover state uses the same enter/leave
  flicker as F6.
- **F11 Popover** (`PopoverProps`). `popover.tsx`: no viewport clamping or
  flip, so a popover near an edge renders off screen; position is measured
  once per render, so it goes stale on scroll, resize or anchor layout change;
  no Escape handling (only the backdrop press calls `onClose`); no focus
  management; every popover is wrapped in `ThemeScope scope="contextMenu"`
  regardless of content. Placement is limited to the four contract values, but
  3.3 will add rect anchoring and submenus, so these gaps matter there.
- **F12 Toast** (`showToast`). `toast.tsx` uses the message as the id, so two
  different toasts with the same text replace each other and `hide()` of the
  first hides the second; the container has no `aria-live`/`role="status"`;
  actions are keyed by `text` (duplicates collide).

### Editor and embeds

- **F13 EditorSurface** (`EditorSurfaceProps`/`EditorHandle`). It is the real
  Tiptap editor (not a stub), but: `sx` is never applied, `onPreviewDocument`
  is never called, `sendAttachmentProgress` is a no-op, `scrollToHeading` uses
  `document.getElementById` (not scoped to the editor, wrong with two editors
  mounted), and `onReady` fires only when the Tiptap instance loads, not on
  mount. It also imports `web-app-editor/*` from `apps/web`, which is why it
  cannot move into `ui-kit` (plan 3.1).
- **F14 PdfViewer, AvatarEditor** (`pdf.ts`, `avatar-editor.ts`).
  `embeds.tsx` renders "… is not implemented on web" and every handle method
  throws. Placeholders by design (README lists them); neither is needed by the
  editor UI.
- **F15 WebView** (`WebViewHandle.injectJavaScript`, `injectedJavaScript`).
  `injectJavaScript` throws and `injectedJavaScript` is ignored. The iframe is
  `sandbox="allow-scripts allow-forms allow-popups"` (no
  `allow-same-origin`), so `reload()` through `contentWindow.location` throws
  for `srcdoc` and cross-origin sources. The message listener accepts any
  origin from the frame and `postMessage` targets `"*"`.

## Notes on rows that conform

- **N1** `BoxElement` toggles DOM classes and focus from `testID` values
  (`list-item`, `editor-session-active`, `diff-viewer`, `tab-*`, `routeHeader`)
  and `use-dom.tsx` remaps `editor-tags`, `menu-*`, `virtual-list` to the
  `apps/web` e2e selectors. Behaviour outside the contract, tied to
  `test:e2e:web`; it must stay in the app-level web target, not in `ui-kit`.
- **N2** `Link` runs `onPress` and the browser navigation (`target="_blank"`)
  together; a caller that only wants `onPress` must pass no `href`.
- **N3** `Input.onSubmit` fires on every `Enter` keydown, including while an IME
  composition is active.
- **N4** `Checkbox` sets `id={props.testID}`, overriding `props.id`, and
  duplicates when the same `testID` is used twice.
- **N5** `Select` is a native `<select>`: no placeholder, no popup styling, so it
  looks different from the desktop select.
- **N6** `ThemeScope` only swaps the React context. It does not set CSS
  variables or an emotion theme; the editor needs the separate
  `EmotionThemeProvider` (plan 3.4).
- **N7** `SplitPane.collapse` writes `csp:undefined-<id>:expanded` when
  `autoSaveId` is unset.
- **N8** `LayoutRoot` injects base styles during render (`injectBaseStyles`),
  a side effect in render.
- **N9** `TitleBar` ignores `trafficLightInset` (correct on web) and hard-codes
  `testID="title-bar"`.
- **N10** `useMediaQuery` creates a new `MediaQueryList` and subscribe
  function every render, so it resubscribes each render. `hooks.ts` also
  registers a `pointermove` listener at import time.

## Theme-ui and `@notesnook/ui` wrappers

The plan asked which primitives are written directly on `react-dom` instead of
wrapping theme-ui or `@notesnook/ui`. Result: **none wrap them.** Every
primitive is a plain DOM element styled through the target's own engine
(`style/engine.ts`, which only borrows `css` from `@theme-ui/css`) and the
shared declarations in `src/shared/style`. No web file imports
`@notesnook/ui`, `theme-ui` components or emotion except `editor.tsx`
(`EmotionThemeProvider`). So "wrappers over theme-ui" is not how the target is
built; whether it should be is a decision for 4.1, which has to replace
`theme-ui` and `@notesnook/ui` imports in the editor UI with `@ui`.

## Missing for the editor UI (input to 3.3, 3.4, 4.1)

Nothing the editor UI needs is entirely absent from the contract set, but these
are placeholders or below the bar:

| Need | State | Finding |
| --- | --- | --- |
| Colour picker popup | Placeholder | F3 |
| Anchored popover with flip/clamp | Basic | F11 |
| Menu with submenus | Menu item types exist; no web menu component in `ui/` | 3.3 |
| Virtualised list for large menus | Not virtual | F9 |
| Accessible dialog | Missing roles and focus | F8 |
| Editor `sx`, attachment progress | Not wired | F13 |

## Suggested follow-up order

1. F7 first (remove `src/app` imports from the web target): unblocks 3.1 and 4.x.
2. F11, F3, F8: needed by the editor popups; fold into 3.3.
3. F1, F2, F4, F5, F6, F10, F12: small primitive fixes with the 3.2 test page.
4. F9, F13, F15: larger; schedule only if a consumer needs them.

## Fix status

Nothing was fixed by this audit. The README row "Editor: Stub surface, as on
desktop" was stale (the web `EditorSurface` mounts the real editor) and was
corrected as part of writing this document.
