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

export type Language = { code: string; name: string };
export type SpellRange = { start: number; length: number };

export interface SpellChecker {
  isEnabled(): Promise<boolean>;
  setEnabled(enabled: boolean): Promise<void>;
  getLanguages(): Promise<Language[]>;
  getEnabledLanguages(): Promise<Language[]>;
  setLanguages(languages: string[]): Promise<void>;
  getWords(): Promise<string[]>;
  deleteWord(word: string): Promise<void>;
  check(text: string): Promise<SpellRange[]>;
  suggest(word: string): Promise<string[]>;
  learn(word: string): Promise<void>;
  ignore(word: string): Promise<void>;
}
