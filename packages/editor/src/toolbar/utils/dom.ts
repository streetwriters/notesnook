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

import { createRoot, Root } from "react-dom/client";

export function getToolbarElement() {
  return (
    (document.querySelector(".active .editor-toolbar") as HTMLElement) ||
    undefined
  );
}

export function getPopupContainer() {
  return (
    document.querySelector<HTMLElement>(".active .dialogContainer") ||
    document.body
  );
}

export function getEditorToolbarPopup() {
  return (document.querySelector(".editor-mobile-toolbar-popup") ||
    getToolbarElement()) as HTMLElement;
}

export function getEditorContainer() {
  return (document.querySelector(".active .editor") ||
    getPopupContainer()) as HTMLElement;
}

export function getEditorDOM() {
  return (document.querySelector(".active .ProseMirror") ||
    getEditorContainer()) as HTMLElement; // ProseMirror
}

let popupRoot: Root | undefined = undefined;
export function getPopupRoot() {
  if (!popupRoot) popupRoot = createRoot(getPopupContainer());
  return popupRoot;
}

export function unmountPopupRoot() {
  if (popupRoot) popupRoot.unmount();
  popupRoot = undefined;
}
