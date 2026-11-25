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
  "raw DOM access; the code that needs it moves behind @platform or the native editor, not into the kit";

export const SUBSET = {
  "*.sx":
    "the keys and values desktop can draw (SxProp); see the sx keys table below",
  "*.style":
    "the keys of StyleProp only, no responsive arrays and no theme lookups",
  "*.className": "accepted and ignored on desktop",
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
  "SxProp.export": "stricter than theme-ui's: only what desktop can draw",
  "ThemeUICSSObject.export": "an alias of the kit's stricter sx object",
  "ThemeUIStyleObject.export": "an alias of the kit's stricter sx object",
  "style.display": "the values desktop can lay out; no grid or inline"
};

export const EXCEPTIONS = {
  "*.ref>closest": RAW_DOM,
  "*.ref>querySelector": RAW_DOM,
  "*.ref>appendChild": RAW_DOM,
  "*.ref>classList": RAW_DOM,
  "*.ref>outerHTML": RAW_DOM,
  "Image.maxHeight":
    "not a theme-ui prop either (a .jsx file passes it through to the DOM, where it does nothing); the call site moves it into sx"
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
