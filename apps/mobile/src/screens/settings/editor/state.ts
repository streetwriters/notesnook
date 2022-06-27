import { ToolbarGroupDefinition } from 'notesnook-editor/dist/toolbar/types';
import create, { State } from 'zustand';
import { persist } from 'zustand/middleware';
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
        //@ts-ignore
        presets['custom'] = data;
        console.log(presets['custom']);
        set({ data: data, preset: 'custom', customPresetData: data });
      },
      setPreset: preset => {
        set({ preset, data: preset === 'custom' ? get().customPresetData : presets[preset] });
      }
    }),
    {
      name: 'drag-state-storage', // unique name
      //@ts-ignore
      getStorage: () => MMKV,
      onRehydrateStorage: state => {
        return state => {
          console.log(state, 'rehydrated drag state');
        };
      } // (optional) by default, 'localStorage' is used
    }
  )
);
