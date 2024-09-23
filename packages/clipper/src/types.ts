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
import { FetchOptions } from "./fetch.js";

export type ClipArea = "full-page" | "visible" | "selection" | "article";
export type ClipMode = "simplified" | "screenshot" | "complete";
// | "full"
// | "article"
// | "simple-article"
// | "full-screenshot"
// | "screenshot"
// | "manual";

export type ClipData = string;

export type Filter = (node: HTMLElement) => boolean;

export type InlineOptions = {
  stylesheets?: boolean;
  fonts?: boolean;
  images?: boolean;
  inlineImages?: boolean;
};

export type Options = {
  filter?: Filter;
  backgroundColor?: CSSStyleDeclaration["backgroundColor"];
  width?: number;
  height?: number;
  quality?: number;
  raster?: boolean;
  scale?: number;
  fetchOptions?: FetchOptions;
  inlineOptions?: InlineOptions;
  styles?: boolean;
};

export type Config = {
  corsProxy?: string;
  images?: boolean;
  inlineImages?: boolean;
  styles?: boolean;
};
