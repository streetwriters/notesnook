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

import type { ForwardRefExoticComponent, RefAttributes } from "react";
import type { SxProp } from "./style";

export type PdfSource = { path: string } | { bytes: Uint8Array };

export interface PdfViewerState {
  status: "loading" | "locked" | "ready" | "error";
  pageCount: number;
  page: number;
  zoom: number;
  passwordIncorrect: boolean;
  search: { query: string; hits: number; active: number; status: string };
  error?: string;
}

export interface PdfViewerHandle {
  zoomIn(): void;
  zoomOut(): void;
  setZoom(zoom: number): void;
  goToPage(page: number): void;
  unlock(password: string): Promise<void>;
  search(query: string, options?: { matchCase?: boolean }): Promise<void>;
  nextHit(): void;
  previousHit(): void;
  clearSearch(): void;
  getSelectedText(): Promise<string>;
  download(): Promise<Uint8Array>;
}

export interface PdfViewerProps {
  source: PdfSource;
  fit?: "width" | "page" | number;
  backgroundColor?: string;
  pageBackground?: string;
  pageGap?: number;
  padding?: number;
  pageShadow?: boolean;
  onStateChange?: (state: PdfViewerState) => void;
  sx?: SxProp;
  testID?: string;
}

export declare const PdfViewer: ForwardRefExoticComponent<
  PdfViewerProps & RefAttributes<PdfViewerHandle>
>;
