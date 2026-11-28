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

const RAW_DOM =
  "move the raw DOM access behind @platform or the native editor; the kit gets no DOM methods";

export const SUBSET = {
  "*.sx":
    "theme-ui's type; desktop draws part of it (see the section on sx and the sx keys table)",
  "*.style":
    "React's CSSProperties; desktop draws what it draws of sx",
  "*.className": "accepted and ignored on desktop",
  "Text.className":
    "accepted; desktop reads the selectable class (text can be selected) and ignores the rest",
  "*.overlayClassName": "accepted and ignored on desktop",
  "*.as": "one of the tags in ElementTag; desktop maps each to a role",
  "*.variant": "the variants the Notesnook theme defines",
  "*.title": "shown as a tooltip on web; an accessible description on desktop",
  "*.tabIndex": "0 and -1 only; desktop has no numbered tab order",
  "*.dangerouslySetInnerHTML":
    "desktop draws the text of simple inline HTML, not arbitrary markup",
  "Input.type":
    "text, password, email, number, search, checkbox, radio, color and hidden",
  "Input.autoComplete": "accepted; desktop has no autofill and ignores it",
  "Input.inputMode": "accepted; desktop has no on-screen keyboard",
  "Input.pattern": "accepted; desktop does not validate against it",
  "Input.required":
    "accepted; the browser's validation bubble has no desktop equivalent",
  "Link.target": "_blank and _self",
  "Modal.style": "the content and overlay objects, each a StyleProp",
  "Modal.style.content": "a StyleProp",
  "Modal.style.overlay": "a StyleProp",
  "Modal.data": "data-* attributes; desktop keeps data-test-id only",
  "Virtuoso.style": "a StyleProp on the scroller",
  "GroupedVirtuoso.style": "a StyleProp on the scroller",
  "TableVirtuoso.style": "a StyleProp on the scroller",
  "Virtuoso.increaseViewportBy": "a number or { top, bottom } in pixels",
  "Virtuoso.export":
    "the props and handle methods listed in this table, not the whole react-virtuoso API",
  "GroupedVirtuoso.export":
    "the props and handle methods listed in this table, not the whole react-virtuoso API",
  "TableVirtuoso.export":
    "the props and handle methods listed in this table, not the whole react-virtuoso API",
  "Modal.export":
    "the props listed in this table and Modal.setAppElement, not the whole react-modal API",
  "Components.export":
    "EmptyPlaceholder, Footer, Header, Item, Scroller and TopItemList",
  "SxProp.export": "theme-ui's style object with the kit's own keys",
  "ThemeUICSSObject.export": "an alias of the kit's sx object",
  "ThemeUIStyleObject.export": "the kit's sx object or a function of the theme",
  "style.display": "any value; desktop lays out flex and none"
};

// Used by apps/web but not in the kit. Each one fails the check until the kit
// has it or the call site stops using it; the text is the planned fix.
export const PLANNED_FIXES = {
  "*.ref>closest": RAW_DOM,
  "*.ref>querySelector": RAW_DOM,
  "*.ref>appendChild": RAW_DOM,
  "*.ref>classList": RAW_DOM,
  "*.ref>outerHTML": RAW_DOM
};

const VIRTUOSO = { library: "react-virtuoso" };
const MODAL = { library: "react-modal" };
const THEME_UI = { library: "theme-ui" };

export const UNSUPPORTED = {
  "Virtuoso.useWindowScroll": {
    ...VIRTUOSO,
    reason: "desktop has no document scroll; every list scrolls itself"
  },
  "Virtuoso.followOutput": {
    ...VIRTUOSO,
    reason: "no chat-style list in the app"
  },
  "Virtuoso.endReached": {
    ...VIRTUOSO,
    reason: "lists are backed by the local database, nothing is paged in"
  },
  "Virtuoso.rangeChanged": {
    ...VIRTUOSO,
    reason: "nothing reads the rendered range"
  },
  "Virtuoso.scrollSeekConfiguration": {
    ...VIRTUOSO,
    reason: "the desktop list has no scroll-seek placeholders"
  },
  "Virtuoso.restoreStateFrom": {
    ...VIRTUOSO,
    reason: "state snapshots are tied to react-virtuoso's internals"
  },
  "Virtuoso.horizontalDirection": {
    ...VIRTUOSO,
    reason: "the desktop list is vertical only"
  },
  "Modal.portalClassName": {
    ...MODAL,
    reason: "desktop has no portal node to put a class on"
  },
  "Modal.bodyOpenClassName": {
    ...MODAL,
    reason: "desktop has no document body"
  },
  "Modal.htmlOpenClassName": {
    ...MODAL,
    reason: "desktop has no document element"
  },
  "Modal.parentSelector": {
    ...MODAL,
    reason: "desktop dialogs always open in the window's overlay layer"
  },
  "Modal.closeTimeoutMS": {
    ...MODAL,
    reason: "close animations are CSS-class driven in react-modal"
  },
  "Modal.overlayElement": {
    ...MODAL,
    reason: "takes DOM props; desktop draws its own overlay"
  },
  "Modal.contentElement": {
    ...MODAL,
    reason: "takes DOM props; desktop draws its own content box"
  },
  "Box.css": {
    ...THEME_UI,
    reason: "Emotion's css prop; desktop has no stylesheet"
  },
  "Box.__css": {
    ...THEME_UI,
    reason: "theme-ui internal"
  },
  "Embed.component": {
    ...THEME_UI,
    reason: "an iframe; live embeds belong to the native editor"
  },
  "AspectRatio.component": {
    ...THEME_UI,
    reason: "nothing uses it; sx.aspectRatio is not drawn on desktop"
  },
  "Paragraph.component": { ...THEME_UI, reason: "nothing uses it; use Text" },
  "Heading.component": { ...THEME_UI, reason: "nothing uses it; use Text" },
  "Card.component": { ...THEME_UI, reason: "nothing uses it; use Box" },
  "Container.component": { ...THEME_UI, reason: "nothing uses it; use Box" },
  "NavLink.component": { ...THEME_UI, reason: "nothing uses it; use Link" },
  "IconButton.component": {
    ...THEME_UI,
    reason: "nothing uses it; use Button"
  },
  "Spinner.component": {
    ...THEME_UI,
    reason: "nothing uses it; the app has its own loader icon"
  },
  "Avatar.component": { ...THEME_UI, reason: "nothing uses it; use Image" },
  "Badge.component": { ...THEME_UI, reason: "nothing uses it" },
  "Alert.component": { ...THEME_UI, reason: "nothing uses it" },
  "Divider.component": { ...THEME_UI, reason: "nothing uses it" },
  "Field.component": {
    ...THEME_UI,
    reason: "nothing uses it; the app has its own Field"
  },
  "Close.component": { ...THEME_UI, reason: "nothing uses it" },
  "MenuButton.component": { ...THEME_UI, reason: "nothing uses it" },
  "useColorMode.export": {
    ...THEME_UI,
    reason: "the app switches themes through its own theme store"
  },
  "ThemeUIProvider.export": {
    ...THEME_UI,
    reason: "the kit's ThemeScope provides the theme"
  }
};

const NO_SELECTORS =
  "not matched on desktop: only a tag, class or id below the element is; use :hover / :group-hover for states";
const NO_GRID = "desktop lays out with flexbox only; use Flex and widths";
const NO_SCROLL_STYLE =
  "scrollbars and scroll snapping are drawn by the platform; not styleable";
const NO_TABLE = "desktop has no table layout";

/** sx keys apps/web writes that desktop cannot draw, each with the reason. */
export const SX_EXCEPTIONS = {
  "-moz-appearance": "browser form-control styling; desktop inputs are drawn by the kit",
  "::-webkit-inner-spin-button": "browser number-input spinner; desktop draws none",
  "::-webkit-outer-spin-button": "browser number-input spinner; desktop draws none",
  "::placeholder": "pseudo-element; the kit's Input draws its placeholder in the placeholder colour",
  ":first-of-type": NO_SELECTORS,
  ":last-of-type": NO_SELECTORS,
  ":not(:first-of-type)": NO_SELECTORS,
  ":hover:not(:disabled):not(:active)": NO_SELECTORS,
  ":hover #profile-picture-edit": NO_SELECTORS,
  ":hover #remove-item, :hover #add-item": NO_SELECTORS,
  "[data-viewport-type=\"element\"]": NO_SELECTORS,
  "&:focus": "use the :focus state key",
  "&:hover": "use the :hover state key",
  th: NO_TABLE,
  "th, td": NO_TABLE,
  borderCollapse: NO_TABLE,
  tableLayout: NO_TABLE,
  fieldSizing: "inputs do not size to their content on desktop",
  gridColumn: NO_GRID,
  gridRow: NO_GRID,
  gridTemplateColumns: NO_GRID,
  gridTemplateRows: NO_GRID,
  justifySelf: "a grid property; flexbox has alignSelf only",
  listStyle: "desktop has no list markers",
  msOverflowStyle: NO_SCROLL_STYLE,
  scrollbarWidth: NO_SCROLL_STYLE,
  scrollBehavior: NO_SCROLL_STYLE,
  scrollSnapAlign: NO_SCROLL_STYLE,
  scrollSnapStop: NO_SCROLL_STYLE,
  scrollSnapType: NO_SCROLL_STYLE,
  textWrap: "balance/pretty wrapping is not in the desktop text layout",
  transformOrigin: "desktop transforms always use the element's centre",
  WebkitBackgroundClip: "text clipping of a background is not drawn",
  WebkitTextFillColor: "text clipping of a background is not drawn",
  WebkitBoxOrient: "use lineClamp",
  wordSpacing: "the desktop text layout has letterSpacing only"
};

const DRAWN_STATES = new Set([
  ":hover",
  ":active",
  ":focus",
  ":focus-visible",
  ":disabled"
]);

/** The reason an sx key is not drawn on desktop, or undefined. */
export function sxException(key) {
  if (key in SX_EXCEPTIONS) return SX_EXCEPTIONS[key];
  // A selector naming a tag, class or id below the element is drawn
  // (shared/style/selectors.ts); one with a pseudo, attribute or sibling is not.
  if (DRAWN_STATES.has(key)) return undefined;
  if (/[:[+~]/.test(key)) return NO_SELECTORS;
  return undefined;
}
