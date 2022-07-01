import { ToolbarGroupDefinition } from 'notesnook-editor/dist/toolbar/types';
import create, { State } from 'zustand';
import { persist } from 'zustand/middleware';
import { useNoteStore } from '../../../stores/use-notes-store';
import { useSettingStore } from '../../../stores/use-setting-store';
import { db } from '../../../utils/database';
import { MMKV } from '../../../utils/database/mmkv';
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
        presets['custom'] = data;
        db.settings?.setToolbarConfig(useSettingStore.getState().deviceMode || 'mobile', {
          preset: 'custom',
          config: data
        });
        set({ data: data, preset: 'custom', customPresetData: data });
      },
      setPreset: preset => {
        db.settings?.setToolbarConfig(useSettingStore.getState().deviceMode || 'mobile', {
          preset,
          config: preset === 'custom' ? get().customPresetData : []
        });
        set({ preset, data: preset === 'custom' ? get().customPresetData : presets[preset] });
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
          data: preset === 'custom' ? toolbarConfig?.config : presets[preset],
          customPresetData: preset === 'custom' ? toolbarConfig?.config : presets['custom']
        });
      }
    }),
    {
      name: 'drag-state-storage', // unique name
      //@ts-ignore
      getStorage: () => MMKV,
      onRehydrateStorage: () => {
        return state => {
          logger.info('DragState', 'rehydrated drag state');
          if (!useNoteStore.getState().loading) {
            state?.init();
          } else {
            const unsub = useNoteStore.subscribe(_state => {
              if (!_state.loading) {
                state?.init();
                unsub();
              }
            });
          }
        };
      } // (optional) by default, 'localStorage' is used
    }
  )
);
