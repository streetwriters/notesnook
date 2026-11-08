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

import { notImplemented } from "./not-implemented";

export type PresetId = "default" | "minimal" | "custom";
export type Preset = {
  id: PresetId;
  title: string;
  tools: unknown[];
  editor?: unknown;
};

export const getCurrentPreset: () => Promise<Preset> =
  notImplemented("getCurrentPreset");
export const getAllPresets: () => Preset[] = notImplemented("getAllPresets");
export const getPreset: (id: PresetId) => Preset = notImplemented("getPreset");
export const getPresetTools: (preset: Preset) => unknown[] =
  notImplemented("getPresetTools");
export const setToolbarPreset: (id: PresetId) => Promise<void> =
  notImplemented("setToolbarPreset");
