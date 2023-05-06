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
export type Colors = {
  accent: string;
  paragraph: string;
  background: string;
  border: string;
  heading: string;
  icon: string;
  separator: string;
  placeholder: string;
  hover: string;
  shade: string;
  backdrop: string;
  textSelection: string;
};

export type VariantsWithStaticColors<TRequired extends boolean = false> =
  Variants<TRequired> & {
    static: {
      red: string;
      orange: string;
      yellow: string;
      green: string;
      blue: string;
      purple: string;
      gray: string;
      black: string;
      white: string;
    };
  };

export type Variants<TRequired extends boolean = false> = {
  primary: TRequired extends true ? Colors : Partial<Colors>;
  secondary: TRequired extends true ? Colors : Partial<Colors>;
  disabled: TRequired extends true ? Colors : Partial<Colors>;
  error: TRequired extends true ? Colors : Partial<Colors>;
  warning: TRequired extends true ? Colors : Partial<Colors>;
  success: TRequired extends true ? Colors : Partial<Colors>;
};

export type ThemeScopes = {
  base: Variants<true>;
  statusBar?: Partial<Variants>;
  list?: Partial<Variants>;
  editor?: Partial<Variants>;
  dialog?: Partial<Variants>;
  navigationMenu?: Partial<Variants>;
  contextMenu?: Partial<Variants>;
  editorToolbar?: Partial<Variants>;
  sheet?: Partial<Variants>;
};

export type ThemeDefinition = {
  name: string;
  id: string;
  version: string;
  author: string;
  homepage: string;
  description: string;
  logo?: string;
  colorScheme: "light" | "dark";
  codeBlockCSS: string;
  tags?: string[];
  compatibilityVersion: string;
  scopes: ThemeScopes;
};
