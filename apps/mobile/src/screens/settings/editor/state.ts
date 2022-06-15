import create, { State } from 'zustand';
import { presets, toolbarDefinition } from './toolbar-definition';

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
  data: ToolDefinition[][];
  setData: (data: ToolDefinition[][]) => void;
  preset: 'default' | 'minimal' | 'custom';
  setPreset: (preset: 'default' | 'minimal' | 'custom') => void;
}

export const useDragState = create<DragState>((set, get) => ({
  preset: 'default',
  dragged: {},
  setDragged: dragged => {
    set({ dragged });
  },
  data: toolbarDefinition,
  setData: data => {
    //@ts-ignore
    presets['custom'] = data;
    set({ data, preset: 'custom' });
  },
  setPreset: preset => {
    set({ preset, data: presets[preset] });
  }
}));
