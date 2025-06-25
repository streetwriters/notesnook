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

import { Editor, AnyExtension, Extensions } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { builders, NodeBuilder } from "prosemirror-test-builder";
import { Schema } from "@tiptap/pm/model";

type Builder<TNodes extends string> = {
  scheme: Schema;
} & Record<TNodes, NodeBuilder>;

type EditorOptions<TNodes extends string> = {
  element?: HTMLElement;
  extensions: Record<TNodes, AnyExtension | false>;
  initialContent?: string;
};

export function createEditor<TNodes extends string>(
  options: EditorOptions<TNodes>
) {
  const { extensions, initialContent, element } = options;
  const editor = new Editor({
    element,
    content: initialContent,
    extensions: [
      StarterKit.configure({
        ...Object.entries(extensions).reduce(
          (prev, [name]) => ({
            ...prev,
            [name]: false
          }),
          {}
        )
      }),
      ...(Object.values(extensions) as Extensions)
    ]
  });

  const builder = builders(editor.schema) as unknown as Builder<TNodes>;

  return { editor, builder };
}

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  children: (HTMLElement | string)[] = [],
  attr: Record<string, string | undefined> = {}
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  element.append(
    ...children.map((v) =>
      typeof v === "string" ? document.createTextNode(v) : v
    )
  );
  for (const key in attr) {
    const value = attr[key];
    if (value) element.setAttribute(key, value);
  }
  return element;
}

function elem<K extends keyof HTMLElementTagNameMap>(tag: K) {
  return function (
    children: (HTMLElement | string)[] = [],
    attr: Record<string, string | undefined> = {}
  ): HTMLElementTagNameMap[K] {
    return h(tag, children, attr);
  };
}

export const ul = elem("ul");
export const li = elem("li");
export const p = elem("p");

export function text(text: string) {
  return document.createTextNode(text);
}
