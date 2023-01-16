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

import type { ToolbarGroupDefinition } from "@notesnook/editor/dist/toolbar/types";
import create, { State } from "zustand";
import { persist, StateStorage } from "zustand/middleware";
import { db } from "../../../common/database";
import { MMKV } from "../../../common/database/mmkv";
import { useNoteStore } from "../../../stores/use-notes-store";
import { useSettingStore } from "../../../stores/use-setting-store";
import { presets } from "./toolbar-definition";
export type ToolDefinition = string | string[];

export type DraggedItem = {
  item?: ToolDefinition | ToolDefinition[];
  type?: "tool" | "group" | "subgroup";
  height?: number;
  groupIndex?: number;
};

export type DraggableItem = {
  item: ToolDefinition | ToolDefinition[];
  index: number;
  parentIndex?: number;
  groupIndex?: number;
};

export interface DragState extends State {
  dragged: DraggedItem;
  setDragged: (dragged: DraggedItem) => void;
  data: ToolbarGroupDefinition[];
  customPresetData: ToolbarGroupDefinition[];
  setData: (data: ToolbarGroupDefinition[]) => void;
  preset: "default" | "minimal" | "custom";
  setPreset: (preset: "default" | "minimal" | "custom") => void;
  init: () => Promise<void>;
}

function clone<T>(value: T[]) {
  return JSON.parse(JSON.stringify(value));
}

export const useDragState = create<DragState>(
  persist(
    (set, get) => ({
      preset: "default",
      dragged: {},
      setDragged: (dragged) => {
        set({ dragged });
      },
      data: presets["default"],
      customPresetData: presets["custom"],
      setData: (data) => {
        const _data = clone(data);

        presets["custom"] = _data;
        db.settings?.setToolbarConfig(
          useSettingStore.getState().deviceMode || "mobile",
          {
            preset: "custom",
            config: clone(_data)
          }
        );
        set({ data: _data, preset: "custom", customPresetData: _data });
      },
      setPreset: (preset) => {
        db.settings?.setToolbarConfig(
          useSettingStore.getState().deviceMode || "mobile",
          {
            preset,
            config: preset === "custom" ? clone(get().customPresetData) : []
          }
        );
        set({
          preset,
          data:
            preset === "custom"
              ? clone(get().customPresetData)
              : clone(presets[preset])
        });
      },
      init: async () => {
        const user = await db.user?.getUser();
        if (!user) return;
        const toolbarConfig = db.settings?.getToolbarConfig(
          useSettingStore.getState().deviceMode || "mobile"
        );
        if (!toolbarConfig) {
          logger.info("DragState", "No user defined toolbar config was found");
          return;
        }
        const preset = toolbarConfig?.preset as DragState["preset"];
        logger.info(
          "DragState",
          "Init user toolbar config",
          preset,
          toolbarConfig?.config
        );
        set({
          preset: preset,
          data:
            preset === "custom"
              ? clone(toolbarConfig?.config)
              : clone(presets[preset]),
          customPresetData:
            preset === "custom"
              ? clone(toolbarConfig?.config)
              : clone(presets["custom"])
        });
      }
    }),
    {
      name: "drag-state-storage", // unique name
      getStorage: () => MMKV as StateStorage,
      onRehydrateStorage: () => {
        return () => {
          logger.info(
            "DragState",
            "rehydrated drag state",
            useNoteStore.getState().loading
          );
          if (!useNoteStore.getState().loading) {
            useDragState.getState().init();
          } else {
            setTimeout(() => {
              useDragState.getState().init();
            }, 1000);
          }
        };
      } // (optional) by default, 'localStorage' is used
    }
  )
);
