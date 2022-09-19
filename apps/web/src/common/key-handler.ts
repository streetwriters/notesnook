/* eslint-disable header/header */
/*
Copyright (C) 2015-2017 by Marijn Haverbeke <marijnh@gmail.com> and others

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
import { base, keyName } from "w3c-keyname";

export type Command = () => boolean;
const mac =
  typeof navigator != "undefined"
    ? /Mac|iP(hone|[oa]d)/.test(navigator.platform)
    : false;

function normalizeKeyName(name: string) {
  const parts = name.split(/-(?!$)/);
  let result = parts[parts.length - 1];
  if (result == "Space") result = " ";
  let alt, ctrl, shift, meta;
  for (let i = 0; i < parts.length - 1; i++) {
    const mod = parts[i];
    if (/^(cmd|meta|m)$/i.test(mod)) meta = true;
    else if (/^a(lt)?$/i.test(mod)) alt = true;
    else if (/^(c|ctrl|control)$/i.test(mod)) ctrl = true;
    else if (/^s(hift)?$/i.test(mod)) shift = true;
    else if (/^mod$/i.test(mod)) {
      if (mac) meta = true;
      else ctrl = true;
    } else throw new Error("Unrecognized modifier name: " + mod);
  }
  if (alt) result = "Alt-" + result;
  if (ctrl) result = "Ctrl-" + result;
  if (meta) result = "Meta-" + result;
  if (shift) result = "Shift-" + result;
  return result;
}

function normalize(map: { [key: string]: Command }) {
  const copy: { [key: string]: Command } = Object.create(null);
  for (const prop in map) copy[normalizeKeyName(prop)] = map[prop];
  return copy;
}

function modifiers(name: string, event: KeyboardEvent, shift: boolean) {
  if (event.altKey) name = "Alt-" + name;
  if (event.ctrlKey) name = "Ctrl-" + name;
  if (event.metaKey) name = "Meta-" + name;
  if (shift !== false && event.shiftKey) name = "Shift-" + name;
  return name;
}

// Given a set of bindings (using the same format as
// [`keymap`](#keymap.keymap)), return a [keydown
// handler](#view.EditorProps.handleKeyDown) that handles them.
export function keydownHandler(
  bindings: Record<string, Command>
): (event: KeyboardEvent) => boolean {
  const map = normalize(bindings);
  return function (event) {
    const name = keyName(event),
      isChar = name.length == 1 && name != " ";
    let baseName: string;
    const direct = map[modifiers(name, event, !isChar)];
    if (direct && direct()) {
      event.preventDefault();
      return true;
    }
    if (
      isChar &&
      (event.shiftKey ||
        event.altKey ||
        event.metaKey ||
        name.charCodeAt(0) > 127) &&
      (baseName = base[event.keyCode]) &&
      baseName != name
    ) {
      // Try falling back to the keyCode when there's a modifier
      // active or the character produced isn't ASCII, and our table
      // produces a different name from the the keyCode. See #668,
      // #1060
      const fromCode = map[modifiers(baseName, event, true)];
      if (fromCode && fromCode()) {
        event.preventDefault();
        return true;
      }
    } else if (isChar && event.shiftKey) {
      // Otherwise, if shift is active, also try the binding with the
      // Shift- prefix enabled. See #997
      const withShift = map[modifiers(name, event, true)];
      if (withShift && withShift()) {
        event.preventDefault();
        return true;
      }
    }
    return false;
  };
}
