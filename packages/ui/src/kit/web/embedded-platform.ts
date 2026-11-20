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

/**
 * The slice of `@platform` the web target of `@ui` needs when it is embedded
 * in an app that is not desktop-native (`apps/web`, `editor-mobile`). Those
 * apps alias `@ui` to `web/index.ts` and `@platform` to this file, so they do
 * not pull in desktop-native's platform services.
 */

const CONFIG_PREFIX = "nn-ui:";

export const config = {
  get<T>(key: string, def?: T): T {
    try {
      const value = localStorage.getItem(CONFIG_PREFIX + key);
      return value === null ? (def as T) : (JSON.parse(value) as T);
    } catch {
      return def as T;
    }
  },
  set<T>(key: string, value: T): T {
    try {
      localStorage.setItem(CONFIG_PREFIX + key, JSON.stringify(value));
    } catch {
      // storage unavailable (private mode, quota): keep going without it
    }
    return value;
  },
  remove(key: string): void {
    try {
      localStorage.removeItem(CONFIG_PREFIX + key);
    } catch {
      // ignore
    }
  }
};

export interface EmbeddedKeyEvent {
  key: string;
  preventDefault(): void;
}

export const keyboard = {
  register(
    keys: string[],
    handler: (event: EmbeddedKeyEvent) => void,
    _options?: { allowInTextInput?: boolean }
  ): () => void {
    const wanted = keys.map((key) => key.toLowerCase());
    const listener = (event: KeyboardEvent) => {
      if (wanted.includes(event.key.toLowerCase())) handler(event);
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }
};
