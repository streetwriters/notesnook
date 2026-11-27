# UI kit: the web API

The UI kit (`packages/ui/src/kit`) is written against the API `apps/web` already uses: theme-ui components, DOM props and events, react-virtuoso lists and react-modal dialogs. This document says, for every one of those APIs that `apps/web` uses, whether the kit's contract (`packages/ui/src/kit/contracts`) keeps it, keeps a subset of it, or does not support it on desktop.

The table at the end is generated. Do not edit it by hand:

```sh
# rewrite the table from a fresh scan of apps/web/src
npm run check:web-api

# check only, write nothing (same exit code)
npm run check:web-api -- --check
```

The command exits with 1 when `apps/web` uses something the contract does not have, even when the note gives a planned fix; when it has the name only as a deprecated alias; or when it lists the item as not supported.

## What the statuses mean

| Status | Meaning |
|---|---|
| kept | Same name and the same shape as on the web. |
| subset | Same name; the type accepts less than the web's, and the note says what. Everything `apps/web` passes today still fits. |
| missing | `apps/web` uses it and the contract does not have it, or has it only as a deprecated alias. The note is the planned fix: the kit gets the API, or the call site stops using it. The check fails until then. |
| not supported | Not in the contract. Allowed only while nothing in `apps/web` uses it; the check fails as soon as something does. |

## The contract in short

**Props.** Every element takes `sx`, `style`, `className`, `id`, `title`, `dir`, `tabIndex`, `data-*`, `aria-label`, `aria-hidden`, `aria-invalid`, `aria-describedby`, and the handlers `onClick`, `onAuxClick`, `onDoubleClick`, `onContextMenu`, `onMouseDown/Up/Move/Enter/Leave`, `onPointerDown/Move/Up`, `onTouchStart/Move/End`, `onWheel`, `onFocus`, `onBlur`, `onKeyDown/Up/Press`, `onSubmit`, `draggable`, `onDragStart/End/Enter/Over/Leave` and `onDrop`. `className` is accepted and ignored on desktop. Tests find elements by `data-test-id`.

**Events.** Handlers receive DOM-shaped events (`contracts/events.ts`): `target`, `currentTarget`, `preventDefault`, `stopPropagation` on all of them; `key`, `code`, `repeat` and the modifier keys on keyboard events; `clientX/Y`, `pageX/Y`, `button`, `buttons`, `detail` on mouse events; `deltaX/Y` on wheel events; `dataTransfer` on drag events; `clipboardData` on paste.

**Form controls.** `Input`, `Textarea`, `Checkbox`, `Radio`, `Switch`, `Slider` and `Select` take `onChange(event)` and the handler reads `event.target.value` or `event.target.checked`. `Select` takes `<option>` children.

**Refs.** A ref to a kit element is a `UIElement` (`contracts/elements.ts`), a subset of `HTMLElement`: `focus`, `blur`, `getBoundingClientRect`, `scrollIntoView`, `scrollTo`, `contains`, `scrollTop`, `scrollLeft` and the read-only `scroll*`, `client*` and `offset*` sizes. Inputs add `value`, `checked`, `valueAsNumber`, `select`, `setSelectionRange`, `selectionStart` and `selectionEnd`.

**Lists.** `Virtuoso`, `GroupedVirtuoso` and `TableVirtuoso` with the props `apps/web` uses (`data`, `totalCount`, `itemContent`, `computeItemKey`, `context`, `components`, `fixedItemHeight`, `defaultItemHeight`, `increaseViewportBy`, `initialTopMostItemIndex`, `customScrollParent`), and a handle with `scrollToIndex`, `scrollIntoView`, `scrollTo` and `scrollBy`.

**Dialogs.** `Modal` with react-modal's `isOpen`, `onRequestClose`, `onAfterOpen`, `onAfterClose`, `shouldCloseOnEsc`, `shouldCloseOnOverlayClick`, `shouldFocusAfterRender`, `shouldReturnFocusAfterClose`, `style` (`content`, `overlay`), `className`, `overlayClassName`, `contentLabel`, `id`, `testId`, `data`, and `Modal.setAppElement`.

**Menus.** `MenuPresenter`, `PopupPresenter`, `PositionOptions` and the menu item types that `apps/web/src/components/menu` and its callers import from `@notesnook/ui`.

**Styles that replace React Native props.** `numberOfLines={2}` becomes `sx={{ lineClamp: 2 }}`; `resizeMode="cover"` becomes `sx={{ objectFit: "cover" }}`.

## The web implementation

On the web (`packages/ui/src/kit/web`) the kit is a thin layer, so what `apps/web` draws cannot change when it imports the kit:

- `Box`, `Flex`, `Grid`, `Text`, `Button`, `Label`, `Link`, `Image`, `Input`, `Textarea`, `Checkbox`, `Radio`, `Select`, `Switch`, `Slider`, `Progress` and `Donut` are theme-ui's components (`primitives.tsx`); `sx` is handled by theme-ui.
- `Virtuoso`, `GroupedVirtuoso` and `TableVirtuoso` are react-virtuoso's, `Modal` is react-modal's, `MenuPresenter` and `PopupPresenter` are `@notesnook/ui`'s, `useThemeUI` is theme-ui's, `ScrollContainer` is `mac-scrollbar` (as in `apps/web`).
- `WebThemeProvider` and `ThemeScope` (`theme.tsx`) mount theme-ui's theme and the scope's CSS variables. Without a `WebThemeProvider` above (the kit embedded in `apps/web`) `ThemeScope` uses the app's own `@notesnook/theme` theme.
- `legacy.tsx` is the only file that knows the deprecated names below: it renames them to the DOM props before theme-ui's component renders, and gives old call sites the layout defaults they were written for (a `Box` is a column flexbox, a `Button` a row). `sx.ts` rewrites the kit-only `sx` shapes (`transition` and `animation` objects, `transform` arrays, `lineClamp`, `:group-hover`, `:drag-over`, a colour token at the end of a `border`) into CSS theme-ui takes. Both go away with the deprecated names.
- `Icon`, `QRCode`, `ColorPicker`, `SplitPane`, `TitleBar`, `LayoutRoot`, the toast host, and the deprecated `Dialog`, `VirtualList` (now on `Virtuoso`) and `SortableList` keep a web version of their own, built on those primitives. A web popover draws itself in a layer on `document.body`, next to its anchor, so it needs no `PopoverHost` (`apps/web` mounts none, and its editor dropdowns opened nothing before); `PopoverHost` stays as a no-op so existing mounts still compile.

## Where the contract is stricter than the web

The types reject what desktop cannot draw, so a mistake shows up at type-check and not as a screen that looks different:

- `sx` and `style` take only the properties and values in `contracts/style.ts`. For example `float`, `display: "grid"` in `style`, and `objectFit: "scale-down"` are errors.
- `as` takes one of the tags in `ElementTag`; `as="canvas"` is an error.
- A ref must match its component: an `Input` ref is a `UIInputElement`, not a plain `UIElement`.

`contracts/type-tests.tsx` holds one example of each accepted shape and one `@ts-expect-error` for each rejected one. It is type-checked by `npm run tsc`.

## Deprecated names

The old names still type-check and still work, marked `@deprecated`, until every call site has moved. They are then deleted.

| Old | New |
|---|---|
| `onPress` | `onClick` |
| `onHoverIn`, `onHoverOut` | `onMouseEnter`, `onMouseLeave` |
| `testID` | `data-test-id` |
| `onChangeText(text)` on `Input`, `Textarea` | `onChange(event)`, `event.target.value` |
| `onSubmitEditing(text)` on `Input` | `onSubmit` on the enclosing `Box as="form"` |
| `onCheckedChange(checked)` on `Checkbox`, `Radio`, `Switch` | `onChange(event)`, `event.target.checked` |
| `onValueChange(value)` on `Slider`, `Select` | `onChange(event)`, `event.target.value` |
| `options` on `Select` | `<option>` children |
| `numberOfLines` | `sx.lineClamp` |
| `resizeMode` | `sx.objectFit` |
| `droppable`, `acceptsFiles`, `onDropFiles` | `onDragOver`, `onDrop`, `event.dataTransfer.files` |
| `payload`, `x`, `y`, `dropped` on drag events | `dataTransfer`, `clientX`, `clientY` |
| `measureInWindow(callback)` on refs | `getBoundingClientRect()` |
| `PressEvent`, `HoverEvent`, `KeyEvent`, `FocusEvent`, `ContextMenuEvent` | `UIMouseEvent`, `UIKeyboardEvent`, `UIFocusEvent` |
| `VirtualList` | `Virtuoso` |
| `Dialog`, `DialogButton` | `Modal` |

Three of the old props had a web name with a different shape, so they could not stay as aliases under that name and were renamed in this step, in the kit and at every call site: `onChange(checked)` to `onCheckedChange`, `onChange(value)` on `Slider` and `Select` to `onValueChange`, and `Input`'s `onSubmit(text)` to `onSubmitEditing`. `ColorPicker` is a kit-only component and keeps `onChange(value)`.

## Known gaps

- **Implementations.** The contract is ahead of both implementations. The exports listed in `contracts/pending.ts` are left out of both `conformance.ts` files until both targets have them. On desktop, `Virtuoso`, `GroupedVirtuoso`, `TableVirtuoso`, `Modal`, `PopupPresenter` and `MenuPresenter` are implemented (see the next point) and typed against the contract where they are defined. The desktop primitives (`Box`, `Flex`, `Grid`, `Text`, `Button`, `Label`, `Link`, `Image`, `Input`, `Textarea`, `Checkbox`, `Radio`, `Switch`, `Slider`, `Select`, `Icon`) deliver the new events and refs, and still take the deprecated names; desktop also has `Donut`, `useThemeUI` and `alpha`, which stay in `pending.ts` until the web kit has them.
- **Desktop lists, modal, menus and scroll container.** What differs from the web library each one stands in for:
  - `Virtuoso`, `GroupedVirtuoso`, `TableVirtuoso` (`desktop/lists.tsx`) run on the native virtualized list, which owns its scroll view: `customScrollParent` is accepted and unused. A `components.Scroller` works when it renders a kit `ScrollContainer` (as `apps/web`'s scrollers do); that container becomes the list's scroll view. Group headers of `GroupedVirtuoso` scroll with the list instead of sticking to the top. `TableVirtuoso` has no table elements: the fixed header is drawn above the list and each row is `components.TableRow`.
  - `Modal` (`desktop/dialog.tsx`) is drawn where it is rendered; there is no portal, so it belongs at the root of the window. A `theme-scope-<name>` class in `overlayClassName` or `className` applies that theme scope; other class names are ignored. `shouldReturnFocusAfterClose` is accepted and unused, and `setAppElement` does nothing.
  - `PopupPresenter` (`desktop/popover.tsx`) and `MenuPresenter` (`desktop/menu.tsx`) place the popup with `shared/popup-position.ts`, which follows the web's `getPosition`. `movable`, `isMobile` and `container` are accepted and unused. A non-blocking popup has no backdrop, so a click outside it does not close it.
  - `ScrollContainer` (`desktop/layout.tsx`) scrolls on one axis: vertically, or horizontally when only `suppressScrollY` is set. Its ref and the `target` of its `onScroll` event give `scrollTop`, `scrollLeft`, `scrollHeight`, `clientHeight` and `scrollTo`. `trackStyle` and `thumbStyle` are accepted and unused: the scrollbar is the platform's.
  - These components are unit-tested by rendering them headlessly (`desktop/testing/render.ts`, with the stand-ins in `desktop/testing/mocks.ts`).
- **What desktop does differently for a kept name.** `onPaste` is never raised (the native text field reports no paste). `preventDefault()` on a keyboard event does not stop the native key handling. `as` only selects form behaviour (`as="form"`); it sets no accessibility role. `dir`, `aria-invalid`, `aria-describedby`, `data-*` other than `data-test-id`, and on `Input` `name`, `required`, `pattern`, `min`, `max`, `step`, `autoComplete` and `inputMode` are accepted and ignored. `scrollIntoView`, `scrollTo` and setting `scrollTop` act on the nearest native scroll view. A `Label` with its own click handler does not also activate its control.
- **`measureInWindow` is still required on `UIElement`.** While it is, a real DOM element is not assignable to `UIElement`. It becomes assignable when the deprecated names are removed.
- **DOM type names.** `apps/web` writes `useRef<HTMLDivElement>` and `React.MouseEvent<HTMLInputElement>`. Desktop is type-checked without the DOM library, so those names do not exist there. The desktop implementation has to supply them as aliases of the `UI*` types before shared files can use them unchanged.
- **`sx` keys.** `apps/web` writes CSS in `sx` that the contract rejects (selectors, grid, animations and so on). They are listed in the last table. They do not fail the check: each one needs a decision when its file is aligned, either to draw it on desktop and add it, or to rewrite the call site.
- **Shape is checked by name, not by type.** The check compares names only: props, the members a handler reads from its event, the members used on a ref, the keys of `components` and of `Modal`'s `style`, and named imports. It does not compare the type of a value `apps/web` passes with the type the contract declares. A `kept` row proves the name exists, not that the value fits. The value types are proved by type-checking `apps/web` against the kit (plan item 5.3).
- **Planned fixes.** Five raw DOM methods that `apps/web` reads from refs (`closest`, `querySelector`, `appendChild`, `classList`, `outerHTML`) are not in the kit, so the check fails on them until their call sites are aligned. `Image`'s `maxHeight` is no longer one of them: web now sets it in `sx`, which the kit types as `SxProp.maxHeight`.
- **What the scan cannot see.** It reads the source without type-checking it. It follows app components whose props type extends a library's (`FieldProps = InputProps & …`), but not props that travel only through a spread of an untyped object, and not components chosen at runtime.

## Generated table

<!-- generated:start -->

Scanned 339 files in `apps/web/src`: 463 items, 353 kept, 70 subset, 34 not supported (none of them used), 6 missing (6 with a planned fix). A missing item fails the check.

### theme-ui

| Component | API | Kind | Uses | Status | Note |
|---|---|---|---:|---|---|
| Box | `as` | prop | 28 | subset | one of the tags in ElementTag; desktop maps each to a role |
| Box | `bg` | prop | 5 | kept |  |
| Box | `children` | prop | 73 | kept |  |
| Box | `className` | prop | 9 | subset | accepted and ignored on desktop |
| Box | `data-header` | prop | 1 | kept |  |
| Box | `data-index` | prop | 2 | kept |  |
| Box | `data-test-id` | prop | 2 | kept |  |
| Box | `data-top` | prop | 1 | kept |  |
| Box | `id` | prop | 7 | kept |  |
| Box | `mt` | prop | 1 | kept |  |
| Box | `my` | prop | 2 | kept |  |
| Box | `onClick` | prop | 4 | kept |  |
| Box | `onContextMenu` | prop | 2 | kept |  |
| Box | `onDrop` | prop | 1 | kept |  |
| Box | `onKeyPress` | prop | 2 | kept |  |
| Box | `onMouseEnter` | prop | 1 | kept |  |
| Box | `onMouseLeave` | prop | 1 | kept |  |
| Box | `onSubmit` | prop | 4 | kept |  |
| Box | `ref` | prop | 7 | kept |  |
| Box | `style` | prop | 4 | subset | the keys of StyleProp only, no responsive arrays and no theme lookups |
| Box | `sx` | prop | 83 | subset | the keys and values desktop can draw (SxProp); see the sx keys table below |
| Box | `onContextMenu → preventDefault` | event | 2 | kept |  |
| Box | `onContextMenu → stopPropagation` | event | 2 | kept |  |
| Box | `onDrop → dataTransfer.files` | event | 1 | kept |  |
| Box | `onDrop → preventDefault` | event | 1 | kept |  |
| Box | `onKeyPress → key` | event | 2 | kept |  |
| Box | `onSubmit → preventDefault` | event | 4 | kept |  |
| Box | `onSubmit → target` | event | 4 | kept |  |
| Box | `ref.current.closest` | ref | 2 | MISSING | planned fix: move the raw DOM access behind @platform or the native editor; the kit gets no DOM methods |
| Box | `ref.current.offsetTop` | ref | 2 | kept |  |
| Box | `ref.current.outerHTML` | ref | 1 | MISSING | planned fix: move the raw DOM access behind @platform or the native editor; the kit gets no DOM methods |
| Button | `aria-label` | prop | 4 | kept |  |
| Button | `bg` | prop | 2 | kept |  |
| Button | `children` | prop | 167 | kept |  |
| Button | `className` | prop | 4 | subset | accepted and ignored on desktop |
| Button | `data-role` | prop | 1 | kept |  |
| Button | `data-test-id` | prop | 34 | kept |  |
| Button | `disabled` | prop | 33 | kept |  |
| Button | `id` | prop | 7 | kept |  |
| Button | `mr` | prop | 4 | kept |  |
| Button | `mt` | prop | 9 | kept |  |
| Button | `onAuxClick` | prop | 1 | kept |  |
| Button | `onClick` | prop | 158 | kept |  |
| Button | `p` | prop | 2 | kept |  |
| Button | `px` | prop | 3 | kept |  |
| Button | `py` | prop | 1 | kept |  |
| Button | `ref` | prop | 4 | kept |  |
| Button | `sx` | prop | 138 | subset | the keys and values desktop can draw (SxProp); see the sx keys table below |
| Button | `title` | prop | 24 | subset | shown as a tooltip on web; an accessible description on desktop |
| Button | `type` | prop | 26 | kept |  |
| Button | `variant` | prop | 145 | subset | the variants the Notesnook theme defines |
| Button | `onClick → ctrlKey` | event | 1 | kept |  |
| Button | `onClick → currentTarget` | event | 1 | kept |  |
| Button | `onClick → metaKey` | event | 1 | kept |  |
| Button | `onClick → preventDefault` | event | 2 | kept |  |
| Button | `onClick → stopPropagation` | event | 12 | kept |  |
| Checkbox | `checked` | prop | 2 | kept |  |
| Checkbox | `defaultChecked` | prop | 2 | kept |  |
| Checkbox | `id` | prop | 1 | kept |  |
| Checkbox | `name` | prop | 2 | kept |  |
| Checkbox | `onChange` | prop | 3 | kept |  |
| Checkbox | `sx` | prop | 4 | subset | the keys and values desktop can draw (SxProp); see the sx keys table below |
| Checkbox | `onChange → currentTarget.checked` | event | 2 | kept |  |
| Donut | `max` | prop | 1 | kept |  |
| Donut | `size` | prop | 1 | kept |  |
| Donut | `sx` | prop | 1 | subset | the keys and values desktop can draw (SxProp); see the sx keys table below |
| Donut | `value` | prop | 1 | kept |  |
| Flex | `as` | prop | 12 | subset | one of the tags in ElementTag; desktop maps each to a role |
| Flex | `bg` | prop | 17 | kept |  |
| Flex | `children` | prop | 575 | kept |  |
| Flex | `className` | prop | 26 | subset | accepted and ignored on desktop |
| Flex | `data-test-id` | prop | 38 | kept |  |
| Flex | `draggable` | prop | 3 | kept |  |
| Flex | `id` | prop | 19 | kept |  |
| Flex | `mb` | prop | 5 | kept |  |
| Flex | `mt` | prop | 6 | kept |  |
| Flex | `mx` | prop | 3 | kept |  |
| Flex | `my` | prop | 1 | kept |  |
| Flex | `onAuxClick` | prop | 1 | kept |  |
| Flex | `onClick` | prop | 26 | kept |  |
| Flex | `onContextMenu` | prop | 4 | kept |  |
| Flex | `onDoubleClick` | prop | 2 | kept |  |
| Flex | `onDragEnd` | prop | 1 | kept |  |
| Flex | `onDragEnter` | prop | 1 | kept |  |
| Flex | `onDragLeave` | prop | 1 | kept |  |
| Flex | `onDragOver` | prop | 5 | kept |  |
| Flex | `onDragStart` | prop | 1 | kept |  |
| Flex | `onDrop` | prop | 4 | kept |  |
| Flex | `onKeyDown` | prop | 1 | kept |  |
| Flex | `onKeyUp` | prop | 1 | kept |  |
| Flex | `onMouseDown` | prop | 1 | kept |  |
| Flex | `onSubmit` | prop | 7 | kept |  |
| Flex | `p` | prop | 9 | kept |  |
| Flex | `pb` | prop | 1 | kept |  |
| Flex | `pl` | prop | 1 | kept |  |
| Flex | `pr` | prop | 1 | kept |  |
| Flex | `pt` | prop | 1 | kept |  |
| Flex | `px` | prop | 5 | kept |  |
| Flex | `py` | prop | 3 | kept |  |
| Flex | `ref` | prop | 17 | kept |  |
| Flex | `style` | prop | 1 | subset | the keys of StyleProp only, no responsive arrays and no theme lookups |
| Flex | `sx` | prop | 575 | subset | the keys and values desktop can draw (SxProp); see the sx keys table below |
| Flex | `tabIndex` | prop | 2 | subset | 0 and -1 only; desktop has no numbered tab order |
| Flex | `title` | prop | 9 | subset | shown as a tooltip on web; an accessible description on desktop |
| Flex | `variant` | prop | 20 | subset | the variants the Notesnook theme defines |
| Flex | `onAuxClick → button` | event | 1 | kept |  |
| Flex | `onClick → ctrlKey` | event | 3 | kept |  |
| Flex | `onClick → metaKey` | event | 2 | kept |  |
| Flex | `onClick → preventDefault` | event | 1 | kept |  |
| Flex | `onClick → shiftKey` | event | 1 | kept |  |
| Flex | `onClick → stopPropagation` | event | 4 | kept |  |
| Flex | `onContextMenu → preventDefault` | event | 4 | kept |  |
| Flex | `onContextMenu → stopPropagation` | event | 2 | kept |  |
| Flex | `onDoubleClick → stopPropagation` | event | 2 | kept |  |
| Flex | `onDragOver → currentTarget.focus` | event | 1 | kept |  |
| Flex | `onDragOver → preventDefault` | event | 5 | kept |  |
| Flex | `onDragStart → dataTransfer` | event | 1 | kept |  |
| Flex | `onDrop → dataTransfer` | event | 2 | kept |  |
| Flex | `onDrop → stopPropagation` | event | 2 | kept |  |
| Flex | `onKeyDown → ctrlKey` | event | 1 | kept |  |
| Flex | `onKeyDown → key` | event | 1 | kept |  |
| Flex | `onKeyDown → metaKey` | event | 1 | kept |  |
| Flex | `onKeyDown → preventDefault` | event | 1 | kept |  |
| Flex | `onKeyDown → shiftKey` | event | 1 | kept |  |
| Flex | `onKeyUp → key` | event | 1 | kept |  |
| Flex | `onMouseDown → button` | event | 1 | kept |  |
| Flex | `onMouseDown → preventDefault` | event | 1 | kept |  |
| Flex | `onSubmit → preventDefault` | event | 6 | kept |  |
| Flex | `onSubmit → target` | event | 2 | kept |  |
| Flex | `ref.current.appendChild` | ref | 1 | MISSING | planned fix: move the raw DOM access behind @platform or the native editor; the kit gets no DOM methods |
| Flex | `ref.current.classList` | ref | 1 | MISSING | planned fix: move the raw DOM access behind @platform or the native editor; the kit gets no DOM methods |
| Flex | `ref.current.closest` | ref | 1 | MISSING | planned fix: move the raw DOM access behind @platform or the native editor; the kit gets no DOM methods |
| Flex | `ref.current.focus` | ref | 1 | kept |  |
| Flex | `ref.current.getBoundingClientRect` | ref | 1 | kept |  |
| Flex | `ref.current.querySelector` | ref | 2 | MISSING | planned fix: move the raw DOM access behind @platform or the native editor; the kit gets no DOM methods |
| Grid | `children` | prop | 2 | kept |  |
| Grid | `columns` | prop | 1 | kept |  |
| Grid | `sx` | prop | 2 | subset | the keys and values desktop can draw (SxProp); see the sx keys table below |
| Image | `alt` | prop | 1 | kept |  |
| Image | `draggable` | prop | 1 | kept |  |
| Image | `onClick` | prop | 1 | kept |  |
| Image | `onDoubleClick` | prop | 1 | kept |  |
| Image | `onLoad` | prop | 1 | kept |  |
| Image | `onMouseDown` | prop | 1 | kept |  |
| Image | `onMouseLeave` | prop | 1 | kept |  |
| Image | `onMouseMove` | prop | 1 | kept |  |
| Image | `onMouseUp` | prop | 1 | kept |  |
| Image | `onTouchEnd` | prop | 1 | kept |  |
| Image | `onTouchMove` | prop | 1 | kept |  |
| Image | `onTouchStart` | prop | 1 | kept |  |
| Image | `src` | prop | 27 | kept |  |
| Image | `style` | prop | 4 | subset | the keys of StyleProp only, no responsive arrays and no theme lookups |
| Image | `sx` | prop | 22 | subset | the keys and values desktop can draw (SxProp); see the sx keys table below |
| Input | `aria-describedby` | prop | 1 | kept |  |
| Input | `aria-invalid` | prop | 1 | kept |  |
| Input | `aria-label` | prop | 1 | kept |  |
| Input | `as` | prop | 5 | subset | one of the tags in ElementTag; desktop maps each to a role |
| Input | `autoComplete` | prop | 13 | subset | accepted; desktop has no autofill and ignores it |
| Input | `autoFocus` | prop | 27 | kept |  |
| Input | `data-test-id` | prop | 22 | kept |  |
| Input | `defaultValue` | prop | 24 | kept |  |
| Input | `disabled` | prop | 9 | kept |  |
| Input | `id` | prop | 43 | kept |  |
| Input | `inputMode` | prop | 1 | subset | accepted; desktop has no on-screen keyboard |
| Input | `max` | prop | 1 | kept |  |
| Input | `maxLength` | prop | 1 | kept |  |
| Input | `min` | prop | 1 | kept |  |
| Input | `name` | prop | 22 | kept |  |
| Input | `onBlur` | prop | 2 | kept |  |
| Input | `onChange` | prop | 34 | kept |  |
| Input | `onClick` | prop | 1 | kept |  |
| Input | `onFocus` | prop | 2 | kept |  |
| Input | `onKeyDown` | prop | 4 | kept |  |
| Input | `onKeyUp` | prop | 8 | kept |  |
| Input | `onPaste` | prop | 1 | kept |  |
| Input | `pattern` | prop | 1 | subset | accepted; desktop does not validate against it |
| Input | `placeholder` | prop | 42 | kept |  |
| Input | `readOnly` | prop | 1 | kept |  |
| Input | `ref` | prop | 6 | kept |  |
| Input | `required` | prop | 27 | subset | accepted; the browser's validation bubble has no desktop equivalent |
| Input | `step` | prop | 1 | kept |  |
| Input | `sx` | prop | 43 | subset | the keys and values desktop can draw (SxProp); see the sx keys table below |
| Input | `tabIndex` | prop | 1 | subset | 0 and -1 only; desktop has no numbered tab order |
| Input | `type` | prop | 29 | subset | text, password, email, number, search, checkbox, radio, color and hidden |
| Input | `value` | prop | 8 | kept |  |
| Input | `variant` | prop | 10 | subset | the variants the Notesnook theme defines |
| Input | `onBlur → target.value` | event | 1 | kept |  |
| Input | `onBlur → target.valueAsNumber` | event | 1 | kept |  |
| Input | `onChange → currentTarget.value` | event | 1 | kept |  |
| Input | `onChange → target` | event | 2 | kept |  |
| Input | `onChange → target.value` | event | 22 | kept |  |
| Input | `onFocus → target.select` | event | 1 | kept |  |
| Input | `onKeyDown → key` | event | 3 | kept |  |
| Input | `onKeyDown → preventDefault` | event | 2 | kept |  |
| Input | `onKeyDown → stopPropagation` | event | 2 | kept |  |
| Input | `onKeyUp → currentTarget.value` | event | 1 | kept |  |
| Input | `onKeyUp → key` | event | 8 | kept |  |
| Input | `ref.current.focus` | ref | 1 | kept |  |
| Input | `ref.current.value` | ref | 4 | kept |  |
| Label | `children` | prop | 9 | kept |  |
| Label | `htmlFor` | prop | 2 | kept |  |
| Label | `id` | prop | 1 | kept |  |
| Label | `mt` | prop | 1 | kept |  |
| Label | `sx` | prop | 7 | subset | the keys and values desktop can draw (SxProp); see the sx keys table below |
| Label | `variant` | prop | 2 | subset | the variants the Notesnook theme defines |
| Link | `as` | prop | 1 | subset | one of the tags in ElementTag; desktop maps each to a role |
| Link | `children` | prop | 10 | kept |  |
| Link | `href` | prop | 10 | kept |  |
| Link | `rel` | prop | 3 | kept |  |
| Link | `sx` | prop | 7 | subset | the keys and values desktop can draw (SxProp); see the sx keys table below |
| Link | `target` | prop | 10 | subset | _blank and _self |
| Link | `title` | prop | 3 | subset | shown as a tooltip on web; an accessible description on desktop |
| Link | `variant` | prop | 3 | subset | the variants the Notesnook theme defines |
| Progress | `color` | prop | 1 | kept |  |
| Progress | `max` | prop | 2 | kept |  |
| Progress | `sx` | prop | 1 | subset | the keys and values desktop can draw (SxProp); see the sx keys table below |
| Progress | `value` | prop | 2 | kept |  |
| Select | `children` | prop | 1 | kept |  |
| Select | `onChange` | prop | 1 | kept |  |
| Select | `sx` | prop | 1 | subset | the keys and values desktop can draw (SxProp); see the sx keys table below |
| Select | `value` | prop | 1 | kept |  |
| Select | `onChange → target.value` | event | 1 | kept |  |
| Slider | `max` | prop | 1 | kept |  |
| Slider | `min` | prop | 1 | kept |  |
| Slider | `onChange` | prop | 1 | kept |  |
| Slider | `step` | prop | 1 | kept |  |
| Slider | `sx` | prop | 1 | subset | the keys and values desktop can draw (SxProp); see the sx keys table below |
| Slider | `value` | prop | 1 | kept |  |
| Slider | `onChange → target.valueAsNumber` | event | 1 | kept |  |
| Switch | `aria-label` | prop | 2 | kept |  |
| Switch | `checked` | prop | 3 | kept |  |
| Switch | `data-checked` | prop | 1 | kept |  |
| Switch | `disabled` | prop | 3 | kept |  |
| Switch | `onChange` | prop | 2 | kept |  |
| Switch | `onClick` | prop | 1 | kept |  |
| Switch | `ref` | prop | 1 | kept |  |
| Switch | `sx` | prop | 4 | subset | the keys and values desktop can draw (SxProp); see the sx keys table below |
| Switch | `title` | prop | 2 | subset | shown as a tooltip on web; an accessible description on desktop |
| Switch | `onClick → stopPropagation` | event | 1 | kept |  |
| Text | `aria-hidden` | prop | 1 | kept |  |
| Text | `as` | prop | 57 | subset | one of the tags in ElementTag; desktop maps each to a role |
| Text | `bg` | prop | 2 | kept |  |
| Text | `children` | prop | 478 | kept |  |
| Text | `className` | prop | 11 | subset | accepted and ignored on desktop |
| Text | `color` | prop | 22 | kept |  |
| Text | `dangerouslySetInnerHTML` | prop | 6 | subset | desktop draws the text of simple inline HTML, not arbitrary markup |
| Text | `data-test-id` | prop | 35 | kept |  |
| Text | `dir` | prop | 6 | kept |  |
| Text | `href` | prop | 2 | kept |  |
| Text | `id` | prop | 5 | kept |  |
| Text | `mb` | prop | 3 | kept |  |
| Text | `ml` | prop | 14 | kept |  |
| Text | `mr` | prop | 1 | kept |  |
| Text | `mt` | prop | 31 | kept |  |
| Text | `mx` | prop | 2 | kept |  |
| Text | `my` | prop | 1 | kept |  |
| Text | `onClick` | prop | 4 | kept |  |
| Text | `p` | prop | 2 | kept |  |
| Text | `pb` | prop | 1 | kept |  |
| Text | `px` | prop | 2 | kept |  |
| Text | `ref` | prop | 1 | kept |  |
| Text | `rel` | prop | 2 | kept |  |
| Text | `sx` | prop | 392 | subset | the keys and values desktop can draw (SxProp); see the sx keys table below |
| Text | `target` | prop | 2 | kept |  |
| Text | `title` | prop | 4 | subset | shown as a tooltip on web; an accessible description on desktop |
| Text | `variant` | prop | 281 | subset | the variants the Notesnook theme defines |
| Textarea | `className` | prop | 1 | subset | accepted and ignored on desktop |
| Textarea | `data-session-id` | prop | 1 | kept |  |
| Textarea | `data-test-id` | prop | 1 | kept |  |
| Textarea | `dir` | prop | 1 | kept |  |
| Textarea | `id` | prop | 1 | kept |  |
| Textarea | `onChange` | prop | 1 | kept |  |
| Textarea | `onKeyDown` | prop | 1 | kept |  |
| Textarea | `onKeyUp` | prop | 1 | kept |  |
| Textarea | `placeholder` | prop | 1 | kept |  |
| Textarea | `readOnly` | prop | 1 | kept |  |
| Textarea | `ref` | prop | 1 | kept |  |
| Textarea | `rows` | prop | 1 | kept |  |
| Textarea | `spellCheck` | prop | 1 | kept |  |
| Textarea | `sx` | prop | 1 | subset | the keys and values desktop can draw (SxProp); see the sx keys table below |
| Textarea | `variant` | prop | 1 | subset | the variants the Notesnook theme defines |
| Textarea | `wrap` | prop | 1 | kept |  |
| Textarea | `onChange → target` | event | 1 | kept |  |
| Textarea | `onChange → target.value` | event | 1 | kept |  |
| Textarea | `onKeyDown → key` | event | 1 | kept |  |
| Textarea | `onKeyDown → preventDefault` | event | 1 | kept |  |
| Textarea | `onKeyUp → key` | event | 1 | kept |  |
| Textarea | `onKeyUp → preventDefault` | event | 1 | kept |  |
| Textarea | `ref.current.value` | ref | 1 | kept |  |
| Box | `Box` | export | 44 | kept |  |
| BoxProps | `BoxProps` | export | 2 | kept |  |
| Button | `Button` | export | 67 | kept |  |
| ButtonProps | `ButtonProps` | export | 2 | kept |  |
| Checkbox | `Checkbox` | export | 4 | kept |  |
| Donut | `Donut` | export | 1 | kept |  |
| Flex | `Flex` | export | 112 | kept |  |
| FlexProps | `FlexProps` | export | 9 | kept |  |
| Grid | `Grid` | export | 2 | kept |  |
| Image | `Image` | export | 10 | kept |  |
| Input | `Input` | export | 11 | kept |  |
| InputProps | `InputProps` | export | 1 | kept |  |
| Label | `Label` | export | 9 | kept |  |
| Link | `Link` | export | 9 | kept |  |
| Progress | `Progress` | export | 3 | kept |  |
| Select | `Select` | export | 1 | kept |  |
| Slider | `Slider` | export | 1 | kept |  |
| Switch | `Switch` | export | 4 | kept |  |
| SwitchProps | `SwitchProps` | export | 1 | kept |  |
| SxProp | `SxProp` | export | 4 | subset | stricter than theme-ui's: only what desktop can draw |
| Text | `Text` | export | 97 | kept |  |
| TextProps | `TextProps` | export | 1 | kept |  |
| Textarea | `Textarea` | export | 1 | kept |  |
| ThemeUICSSObject | `ThemeUICSSObject` | export | 1 | subset | an alias of the kit's stricter sx object |
| ThemeUIStyleObject | `ThemeUIStyleObject` | export | 4 | subset | an alias of the kit's stricter sx object |
| alpha | `alpha` | export | 5 | kept |  |
| useThemeUI | `useThemeUI` | export | 3 | kept |  |
| style | `display` | style key | 3 | subset | the values desktop can lay out; no grid or inline |
| style | `flex` | style key | 5 | kept |  |
| style | `flexDirection` | style key | 2 | kept |  |
| style | `flexShrink` | style key | 7 | kept |  |
| style | `height` | style key | 9 | kept |  |
| style | `left` | style key | 2 | kept |  |
| style | `minWidth` | style key | 2 | kept |  |
| style | `overscrollBehavior` | style key | 1 | kept |  |
| style | `position` | style key | 2 | kept |  |
| style | `top` | style key | 2 | kept |  |
| style | `transform` | style key | 3 | kept |  |
| style | `transition` | style key | 1 | kept |  |
| style | `visibility` | style key | 1 | kept |  |
| style | `width` | style key | 8 | kept |  |
| style | `zIndex` | style key | 2 | kept |  |
| Box | `css` | prop | 0 | not supported | Emotion's css prop; desktop has no stylesheet |
| Box | `__css` | prop | 0 | not supported | theme-ui internal |
| Embed | `Embed` | component | 0 | not supported | an iframe; live embeds belong to the native editor |
| AspectRatio | `AspectRatio` | component | 0 | not supported | nothing uses it; sx.aspectRatio is not drawn on desktop |
| Paragraph | `Paragraph` | component | 0 | not supported | nothing uses it; use Text |
| Heading | `Heading` | component | 0 | not supported | nothing uses it; use Text |
| Card | `Card` | component | 0 | not supported | nothing uses it; use Box |
| Container | `Container` | component | 0 | not supported | nothing uses it; use Box |
| NavLink | `NavLink` | component | 0 | not supported | nothing uses it; use Link |
| IconButton | `IconButton` | component | 0 | not supported | nothing uses it; use Button |
| Spinner | `Spinner` | component | 0 | not supported | nothing uses it; the app has its own loader icon |
| Avatar | `Avatar` | component | 0 | not supported | nothing uses it; use Image |
| Badge | `Badge` | component | 0 | not supported | nothing uses it |
| Alert | `Alert` | component | 0 | not supported | nothing uses it |
| Divider | `Divider` | component | 0 | not supported | nothing uses it |
| Field | `Field` | component | 0 | not supported | nothing uses it; the app has its own Field |
| Close | `Close` | component | 0 | not supported | nothing uses it |
| MenuButton | `MenuButton` | component | 0 | not supported | nothing uses it |
| useColorMode | `useColorMode` | export | 0 | not supported | the app switches themes through its own theme store |
| ThemeUIProvider | `ThemeUIProvider` | export | 0 | not supported | the kit's ThemeScope provides the theme |

### react-virtuoso

| Component | API | Kind | Uses | Status | Note |
|---|---|---|---:|---|---|
| GroupedVirtuoso | `components` | prop | 1 | kept |  |
| GroupedVirtuoso | `components.EmptyPlaceholder` | prop | 1 | kept |  |
| GroupedVirtuoso | `components.Footer` | prop | 1 | kept |  |
| GroupedVirtuoso | `components.Scroller` | prop | 1 | kept |  |
| GroupedVirtuoso | `components.TopItemList` | prop | 1 | kept |  |
| GroupedVirtuoso | `groupContent` | prop | 1 | kept |  |
| GroupedVirtuoso | `groupCounts` | prop | 1 | kept |  |
| GroupedVirtuoso | `itemContent` | prop | 1 | kept |  |
| GroupedVirtuoso | `ref` | prop | 1 | kept |  |
| GroupedVirtuoso | `ref.current.scrollIntoView` | ref | 1 | kept |  |
| TableVirtuoso | `components` | prop | 1 | kept |  |
| TableVirtuoso | `components.Table` | prop | 1 | kept |  |
| TableVirtuoso | `components.TableRow` | prop | 1 | kept |  |
| TableVirtuoso | `computeItemKey` | prop | 1 | kept |  |
| TableVirtuoso | `context` | prop | 1 | kept |  |
| TableVirtuoso | `customScrollParent` | prop | 1 | kept |  |
| TableVirtuoso | `data` | prop | 1 | kept |  |
| TableVirtuoso | `defaultItemHeight` | prop | 1 | kept |  |
| TableVirtuoso | `fixedHeaderContent` | prop | 1 | kept |  |
| TableVirtuoso | `fixedItemHeight` | prop | 1 | kept |  |
| TableVirtuoso | `increaseViewportBy` | prop | 1 | kept |  |
| Virtuoso | `components` | prop | 4 | kept |  |
| Virtuoso | `components.EmptyPlaceholder` | prop | 1 | kept |  |
| Virtuoso | `components.Header` | prop | 1 | kept |  |
| Virtuoso | `components.Item` | prop | 2 | kept |  |
| Virtuoso | `components.Scroller` | prop | 4 | kept |  |
| Virtuoso | `computeItemKey` | prop | 2 | kept |  |
| Virtuoso | `context` | prop | 3 | kept |  |
| Virtuoso | `data` | prop | 2 | kept |  |
| Virtuoso | `data-test-id` | prop | 1 | kept |  |
| Virtuoso | `defaultItemHeight` | prop | 1 | kept |  |
| Virtuoso | `fixedItemHeight` | prop | 1 | kept |  |
| Virtuoso | `increaseViewportBy` | prop | 1 | subset | a number or { top, bottom } in pixels |
| Virtuoso | `itemContent` | prop | 4 | kept |  |
| Virtuoso | `onBlur` | prop | 1 | kept |  |
| Virtuoso | `onKeyDown` | prop | 2 | kept |  |
| Virtuoso | `ref` | prop | 2 | kept |  |
| Virtuoso | `style` | prop | 2 | subset | a StyleProp on the scroller |
| Virtuoso | `totalCount` | prop | 2 | kept |  |
| Virtuoso | `onKeyDown → nativeEvent` | event | 2 | kept |  |
| Virtuoso | `ref.current.scrollToIndex` | ref | 1 | kept |  |
| CalculateViewLocation | `CalculateViewLocation` | export | 1 | kept |  |
| Components | `Components` | export | 2 | subset | EmptyPlaceholder, Footer, Header, Item, Scroller and TopItemList |
| FlatScrollIntoViewLocation | `FlatScrollIntoViewLocation` | export | 1 | kept |  |
| GroupedVirtuoso | `GroupedVirtuoso` | export | 1 | subset | the props and handle methods listed in this table, not the whole react-virtuoso API |
| GroupedVirtuosoHandle | `GroupedVirtuosoHandle` | export | 1 | kept |  |
| ItemProps | `ItemProps` | export | 2 | kept |  |
| ScrollerProps | `ScrollerProps` | export | 2 | kept |  |
| TableVirtuoso | `TableVirtuoso` | export | 1 | subset | the props and handle methods listed in this table, not the whole react-virtuoso API |
| Virtuoso | `Virtuoso` | export | 3 | subset | the props and handle methods listed in this table, not the whole react-virtuoso API |
| VirtuosoHandle | `VirtuosoHandle` | export | 2 | kept |  |
| Virtuoso | `useWindowScroll` | prop | 0 | not supported | desktop has no document scroll; every list scrolls itself |
| Virtuoso | `followOutput` | prop | 0 | not supported | no chat-style list in the app |
| Virtuoso | `endReached` | prop | 0 | not supported | lists are backed by the local database, nothing is paged in |
| Virtuoso | `rangeChanged` | prop | 0 | not supported | nothing reads the rendered range |
| Virtuoso | `scrollSeekConfiguration` | prop | 0 | not supported | the desktop list has no scroll-seek placeholders |
| Virtuoso | `restoreStateFrom` | prop | 0 | not supported | state snapshots are tied to react-virtuoso's internals |
| Virtuoso | `horizontalDirection` | prop | 0 | not supported | the desktop list is vertical only |

### react-modal

| Component | API | Kind | Uses | Status | Note |
|---|---|---|---:|---|---|
| Modal | `children` | prop | 1 | kept |  |
| Modal | `data` | prop | 1 | subset | data-* attributes; desktop keeps data-test-id only |
| Modal | `isOpen` | prop | 1 | kept |  |
| Modal | `onAfterOpen` | prop | 1 | kept |  |
| Modal | `onRequestClose` | prop | 1 | kept |  |
| Modal | `overlayClassName` | prop | 1 | subset | accepted and ignored on desktop |
| Modal | `shouldCloseOnEsc` | prop | 1 | kept |  |
| Modal | `shouldFocusAfterRender` | prop | 1 | kept |  |
| Modal | `shouldReturnFocusAfterClose` | prop | 1 | kept |  |
| Modal | `style` | prop | 1 | subset | the content and overlay objects, each a StyleProp |
| Modal | `style.content` | prop | 1 | subset | a StyleProp |
| Modal | `style.overlay` | prop | 1 | subset | a StyleProp |
| Modal | `Modal` | export | 1 | subset | the props listed in this table and Modal.setAppElement, not the whole react-modal API |
| Modal | `portalClassName` | prop | 0 | not supported | desktop has no portal node to put a class on |
| Modal | `bodyOpenClassName` | prop | 0 | not supported | desktop has no document body |
| Modal | `htmlOpenClassName` | prop | 0 | not supported | desktop has no document element |
| Modal | `parentSelector` | prop | 0 | not supported | desktop dialogs always open in the window's overlay layer |
| Modal | `closeTimeoutMS` | prop | 0 | not supported | close animations are CSS-class driven in react-modal |
| Modal | `overlayElement` | prop | 0 | not supported | takes DOM props; desktop draws its own overlay |
| Modal | `contentElement` | prop | 0 | not supported | takes DOM props; desktop draws its own content box |

### @notesnook/ui

| Component | API | Kind | Uses | Status | Note |
|---|---|---|---:|---|---|
| Icon | `color` | prop | 5 | kept |  |
| Icon | `path` | prop | 5 | kept |  |
| Icon | `size` | prop | 5 | kept |  |
| MenuPresenter | `blocking` | prop | 1 | kept |  |
| MenuPresenter | `focusOnRender` | prop | 1 | kept |  |
| MenuPresenter | `isMobile` | prop | 1 | kept |  |
| MenuPresenter | `isOpen` | prop | 1 | kept |  |
| MenuPresenter | `items` | prop | 1 | kept |  |
| MenuPresenter | `onClose` | prop | 1 | kept |  |
| MenuPresenter | `position` | prop | 1 | kept |  |
| MenuPresenter | `title` | prop | 1 | subset | shown as a tooltip on web; an accessible description on desktop |
| PopupPresenter | `children` | prop | 5 | kept |  |
| PopupPresenter | `isOpen` | prop | 5 | kept |  |
| PopupPresenter | `onClose` | prop | 5 | kept |  |
| PopupPresenter | `position` | prop | 5 | kept |  |
| PopupPresenter | `sx` | prop | 1 | subset | the keys and values desktop can draw (SxProp); see the sx keys table below |
| ScrollContainer | `children` | prop | 8 | kept |  |
| ScrollContainer | `className` | prop | 4 | subset | accepted and ignored on desktop |
| ScrollContainer | `onWheel` | prop | 2 | kept |  |
| ScrollContainer | `style` | prop | 6 | subset | the keys of StyleProp only, no responsive arrays and no theme lookups |
| ScrollContainer | `suppressScrollX` | prop | 1 | kept |  |
| ScrollContainer | `suppressScrollY` | prop | 3 | kept |  |
| ScrollContainer | `thumbStyle` | prop | 3 | kept |  |
| ScrollContainer | `trackStyle` | prop | 3 | kept |  |
| ScrollContainer | `onWheel → deltaX` | event | 1 | kept |  |
| ScrollContainer | `onWheel → deltaY` | event | 2 | kept |  |
| Icon | `Icon` | export | 1 | kept |  |
| MenuButtonItem | `MenuButtonItem` | export | 1 | kept |  |
| MenuItem | `MenuItem` | export | 16 | kept |  |
| MenuPresenter | `MenuPresenter` | export | 1 | kept |  |
| PopupPresenter | `PopupPresenter` | export | 4 | kept |  |
| PositionOptions | `PositionOptions` | export | 1 | kept |  |
| RestrictedSxProp | `RestrictedSxProp` | export | 1 | kept |  |
| ScrollContainer | `ScrollContainer` | export | 8 | kept |  |

### sx keys

174 different keys are written in `sx` objects; 103 are in the contract. The rest are listed here with the reason desktop does not draw them; they do not fail the check.

| Key | Uses | Example | Note |
|---|---:|---|---|
| `-moz-appearance` | 1 | src/components/otp-input/index.tsx | browser form-control styling; desktop inputs are drawn by the kit |
| `::-webkit-inner-spin-button` | 1 | src/components/otp-input/index.tsx | browser number-input spinner; desktop draws none |
| `::-webkit-outer-spin-button` | 1 | src/components/otp-input/index.tsx | browser number-input spinner; desktop draws none |
| `::placeholder` | 1 | src/components/editor/title-box.tsx | pseudo-element; the kit's Input draws its placeholder in the placeholder colour |
| `:disabled` | 1 | src/components/field/index.tsx | not a kit state; style from the disabled prop instead |
| `:first-of-type` | 1 | src/dialogs/mfa/steps.tsx | desktop has no stylesheet or selectors; style the child itself, or use :hover / :group-hover |
| `:hover #profile-picture-edit` | 1 | src/dialogs/settings/components/user-profile.tsx | desktop has no stylesheet or selectors; style the child itself, or use :hover / :group-hover |
| `:hover #remove-item, :hover #add-item` | 1 | src/dialogs/settings/components/customize-toolbar.tsx | desktop has no stylesheet or selectors; style the child itself, or use :hover / :group-hover |
| `:hover:not(:disabled):not(:active)` | 2 | src/dialogs/add-reminder-dialog.tsx | desktop has no stylesheet or selectors; style the child itself, or use :hover / :group-hover |
| `:last-of-type` | 1 | src/dialogs/settings/components/customize-toolbar.tsx | desktop has no stylesheet or selectors; style the child itself, or use :hover / :group-hover |
| `:not(:first-of-type)` | 1 | src/views/auth.tsx | desktop has no stylesheet or selectors; style the child itself, or use :hover / :group-hover |
| `.editor-container` | 1 | src/components/editor/tiptap.tsx | desktop has no stylesheet or selectors; style the child itself, or use :hover / :group-hover |
| `.editor-loading-container.hidden` | 1 | src/components/editor/tiptap.tsx | desktop has no stylesheet or selectors; style the child itself, or use :hover / :group-hover |
| `.match` | 2 | src/components/search-result/index.tsx | desktop has no stylesheet or selectors; style the child itself, or use :hover / :group-hover |
| `.rpv-core__popover-body, .rpv-core__arrow` | 1 | src/components/pdf-preview/index.tsx | desktop has no stylesheet or selectors; style the child itself, or use :hover / :group-hover |
| `.rpv-core__textbox` | 1 | src/components/pdf-preview/index.tsx | desktop has no stylesheet or selectors; style the child itself, or use :hover / :group-hover |
| `.rpv-search__popover .rpv-core__button` | 1 | src/components/pdf-preview/index.tsx | desktop has no stylesheet or selectors; style the child itself, or use :hover / :group-hover |
| `.rpv-search__popover .rpv-core__minimal-button` | 1 | src/components/pdf-preview/index.tsx | desktop has no stylesheet or selectors; style the child itself, or use :hover / :group-hover |
| `.rpv-search__popover .rpv-core__textbox` | 1 | src/components/pdf-preview/index.tsx | desktop has no stylesheet or selectors; style the child itself, or use :hover / :group-hover |
| `.rpv-search__popover label, .rpv-search__popover span` | 1 | src/components/pdf-preview/index.tsx | desktop has no stylesheet or selectors; style the child itself, or use :hover / :group-hover |
| `.rpv-search__popover-label-checkbox` | 1 | src/components/pdf-preview/index.tsx | desktop has no stylesheet or selectors; style the child itself, or use :hover / :group-hover |
| `.tiptap.ProseMirror` | 1 | src/components/editor/tiptap.tsx | desktop has no stylesheet or selectors; style the child itself, or use :hover / :group-hover |
| `[data-viewport-type="element"]` | 1 | src/views/notebooks.tsx | desktop has no stylesheet or selectors; style the child itself, or use :hover / :group-hover |
| `& + svg` | 1 | src/dialogs/settings/components/inbox-api-keys.tsx | desktop has no stylesheet or selectors; style the child itself, or use :hover / :group-hover |
| `& > *` | 1 | src/dialogs/settings/index.tsx | desktop has no stylesheet or selectors; style the child itself, or use :hover / :group-hover |
| `& > label` | 1 | src/dialogs/settings/index.tsx | desktop has no stylesheet or selectors; style the child itself, or use :hover / :group-hover |
| `& label` | 2 | src/components/properties/toggle.tsx | desktop has no stylesheet or selectors; style the child itself, or use :hover / :group-hover |
| `& path` | 1 | src/dialogs/buy-dialog/upgrade-dialog.tsx | desktop has no stylesheet or selectors; style the child itself, or use :hover / :group-hover |
| `& strong` | 1 | src/views/wrapped.tsx | desktop has no stylesheet or selectors; style the child itself, or use :hover / :group-hover |
| `&::-webkit-scrollbar` | 1 | src/views/wrapped.tsx | desktop has no stylesheet or selectors; style the child itself, or use :hover / :group-hover |
| `&:focus` | 1 | src/components/otp-input/index.tsx | use the :focus state key |
| `&:hover` | 1 | src/components/monthly-activity-heatmap/index.tsx | use the :hover state key |
| `&:hover .add-sub-notebook, &:focus-within .add-sub-notebook` | 1 | src/components/notebook-picker.tsx | desktop has no stylesheet or selectors; style the child itself, or use :hover / :group-hover |
| `&:hover .bar` | 1 | src/components/monthly-activity-heatmap/index.tsx | desktop has no stylesheet or selectors; style the child itself, or use :hover / :group-hover |
| `&:hover .tooltip` | 1 | src/components/monthly-activity-heatmap/index.tsx | desktop has no stylesheet or selectors; style the child itself, or use :hover / :group-hover |
| `&:hover svg path` | 5 | src/components/editor/action-bar.tsx | desktop has no stylesheet or selectors; style the child itself, or use :hover / :group-hover |
| `&.active` | 1 | src/components/editor/table-of-contents.tsx | desktop has no stylesheet or selectors; style the child itself, or use :hover / :group-hover |
| `&.active p` | 1 | src/components/editor/table-of-contents.tsx | desktop has no stylesheet or selectors; style the child itself, or use :hover / :group-hover |
| `&.active path` | 1 | src/components/editor/table-of-contents.tsx | desktop has no stylesheet or selectors; style the child itself, or use :hover / :group-hover |
| `backgroundImage` | 1 | src/views/wrapped.tsx | use experimental_backgroundImage; CSS url()/gradient strings are not parsed |
| `backgroundPosition` | 1 | src/views/wrapped.tsx | use experimental_backgroundPosition |
| `backgroundSize` | 2 | src/components/lightbox/index.tsx | use experimental_backgroundSize |
| `borderCollapse` | 1 | src/dialogs/inbox-history-dialog.tsx | desktop has no table layout |
| `colorScheme` | 1 | src/components/field/index.tsx | native form controls follow the kit theme, not a colour scheme |
| `fieldSizing` | 1 | src/components/editor/title-box.tsx | inputs do not size to their content on desktop |
| `gridColumn` | 2 | src/dialogs/settings/components/subscription-status.tsx | desktop lays out with flexbox only; use Flex and widths |
| `gridRow` | 2 | src/dialogs/settings/components/subscription-status.tsx | desktop lays out with flexbox only; use Flex and widths |
| `gridTemplateColumns` | 8 | src/components/announcements/body.jsx | desktop lays out with flexbox only; use Flex and widths |
| `gridTemplateRows` | 2 | src/dialogs/settings/components/subscription-status.tsx | desktop lays out with flexbox only; use Flex and widths |
| `input` | 13 | src/components/filtered-list/index.tsx | desktop has no stylesheet or selectors; style the child itself, or use :hover / :group-hover |
| `justifySelf` | 2 | src/components/auth-container/index.jsx | a grid property; flexbox has alignSelf only |
| `listStyle` | 1 | src/components/notebook-picker.tsx | desktop has no list markers |
| `msOverflowStyle` | 1 | src/views/wrapped.tsx | scrollbars and scroll snapping are drawn by the platform; not styleable |
| `postion` | 1 | src/views/plans.tsx | a typo for position in apps/web; it has no effect there either |
| `resize` | 3 | src/components/editor/title-box.tsx | desktop text areas have no resize handle |
| `scale` | 1 | src/views/plans.tsx | use transform: [{ scale }] |
| `scrollbarWidth` | 1 | src/views/wrapped.tsx | scrollbars and scroll snapping are drawn by the platform; not styleable |
| `scrollBehavior` | 1 | src/views/wrapped.tsx | scrollbars and scroll snapping are drawn by the platform; not styleable |
| `scrollSnapAlign` | 4 | src/app.tsx | scrollbars and scroll snapping are drawn by the platform; not styleable |
| `scrollSnapStop` | 4 | src/app.tsx | scrollbars and scroll snapping are drawn by the platform; not styleable |
| `scrollSnapType` | 1 | src/views/wrapped.tsx | scrollbars and scroll snapping are drawn by the platform; not styleable |
| `tableLayout` | 1 | src/dialogs/inbox-history-dialog.tsx | desktop has no table layout |
| `textWrap` | 2 | src/components/notice/index.tsx | balance/pretty wrapping is not in the desktop text layout |
| `th` | 3 | src/dialogs/attachments-dialog.tsx | desktop has no table layout |
| `th, td` | 1 | src/dialogs/inbox-history-dialog.tsx | desktop has no table layout |
| `transformOrigin` | 2 | src/components/auth-container/index.jsx | desktop transforms always use the element's centre |
| `WebkitBackgroundClip` | 1 | src/views/wrapped.tsx | text clipping of a background is not drawn |
| `WebkitBoxOrient` | 1 | src/components/list-item/index.tsx | use lineClamp |
| `WebkitLineClamp` | 1 | src/components/list-item/index.tsx | use lineClamp |
| `WebkitTextFillColor` | 1 | src/views/wrapped.tsx | text clipping of a background is not drawn |
| `wordSpacing` | 3 | src/components/dialog/index.tsx | the desktop text layout has letterSpacing only |

<!-- generated:end -->
