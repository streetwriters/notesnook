import type { ToolbarGroupDefinition } from '@streetwriters/editor/dist/es/toolbar/types';
import create, { State } from 'zustand';
import { persist } from 'zustand/middleware';
import { useNoteStore } from '../../../stores/use-notes-store';
import { useSettingStore } from '../../../stores/use-setting-store';
import { db } from '../../../common/database';
import { MMKV } from '../../../common/database/mmkv';
import { presets } from './toolbar-definition';
export type ToolDefinition = string | string[];

export type DraggedItem = {
  item?: ToolDefinition | ToolDefinition[];
  type?: 'tool' | 'group' | 'subgroup';
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
  preset: 'default' | 'minimal' | 'custom';
  setPreset: (preset: 'default' | 'minimal' | 'custom') => void;
  init: () => Promise<void>;
}

function clone(value: any[]) {
  return JSON.parse(JSON.stringify(value));
}

export const useDragState = create<DragState>(
  persist(
    (set, get) => ({
      preset: 'default',
      dragged: {},
      setDragged: dragged => {
        set({ dragged });
      },
      data: presets['default'],
      customPresetData: presets['custom'],
      setData: data => {
        const _data = clone(data);
        presets['custom'] = _data;
        db.settings?.setToolbarConfig(useSettingStore.getState().deviceMode || 'mobile', {
          preset: 'custom',
          config: clone(_data)
        });
        set({ data: _data, preset: 'custom', customPresetData: _data });
      },
      setPreset: preset => {
        db.settings?.setToolbarConfig(useSettingStore.getState().deviceMode || 'mobile', {
          preset,
          config: preset === 'custom' ? clone(get().customPresetData) : []
        });
        set({
          preset,
          data: preset === 'custom' ? clone(get().customPresetData) : clone(presets[preset])
        });
      },
      init: async () => {
        const user = await db.user?.getUser();
        if (!user) return;
        const toolbarConfig = db.settings?.getToolbarConfig(
          useSettingStore.getState().deviceMode || 'mobile'
        );
        if (!toolbarConfig) {
          logger.info('DragState', 'No user defined toolbar config was found');
          return;
        }
        const preset = toolbarConfig?.preset as DragState['preset'];
        logger.info('DragState', 'Init user toolbar config', preset, toolbarConfig?.config);
        set({
          //@ts-ignore
          preset: preset,
          data: preset === 'custom' ? clone(toolbarConfig?.config) : clone(presets[preset]),
          customPresetData:
            preset === 'custom' ? clone(toolbarConfig?.config) : clone(presets['custom'])
        });
      }
    }),
    {
      name: 'drag-state-storage', // unique name
      //@ts-ignore
      getStorage: () => MMKV,
      onRehydrateStorage: () => {
        return () => {
          logger.info('DragState', 'rehydrated drag state', useNoteStore.getState().loading);
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
