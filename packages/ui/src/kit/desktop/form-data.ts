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

import type { UIFormData } from "../contracts/primitives";
import type { ElementControl } from "./element";

/**
 * A named field of a form: a text field (its value) or a checkbox or radio
 * (its value when checked), as `<input name>` is for the DOM's FormData.
 */
export interface FormField {
  name: string;
  control: ElementControl;
  toggle: boolean;
}

/** The fields of each form, by the element its submit event targets. */
const fieldsByForm = new WeakMap<object, Set<FormField>>();

export function setFormFields(form: object, fields: Set<FormField>) {
  fieldsByForm.set(form, fields);
}

/**
 * The DOM's `FormData` for a desktop form (`Box as="form"`): built from the
 * submit event's `target`, it holds the value of every named field in the
 * form, as the browser's does.
 */
export class FormData implements UIFormData {
  private readonly data: [string, string][] = [];

  constructor(form?: unknown) {
    const fields =
      form && typeof form === "object" ? fieldsByForm.get(form) : undefined;
    for (const field of fields ?? []) {
      if (field.toggle) {
        if (field.control.checked)
          this.data.push([field.name, field.control.value ?? "on"]);
      } else this.data.push([field.name, field.control.value ?? ""]);
    }
  }

  get(name: string) {
    return this.data.find(([key]) => key === name)?.[1] ?? null;
  }
  getAll(name: string) {
    return this.data.filter(([key]) => key === name).map(([, value]) => value);
  }
  has(name: string) {
    return this.data.some(([key]) => key === name);
  }
  set(name: string, value: string) {
    this.delete(name);
    this.data.push([name, value]);
  }
  append(name: string, value: string) {
    this.data.push([name, value]);
  }
  delete(name: string) {
    for (let i = this.data.length - 1; i >= 0; i--)
      if (this.data[i][0] === name) this.data.splice(i, 1);
  }
  entries() {
    return this.data.map(([k, v]) => [k, v] as [string, string])[
      Symbol.iterator
    ]();
  }
  keys() {
    return this.data.map(([key]) => key)[Symbol.iterator]();
  }
  values() {
    return this.data.map(([, value]) => value)[Symbol.iterator]();
  }
  forEach(callback: (value: string, key: string, parent: UIFormData) => void) {
    for (const [key, value] of this.data) callback(value, key, this);
  }
  [Symbol.iterator]() {
    return this.entries();
  }
}
