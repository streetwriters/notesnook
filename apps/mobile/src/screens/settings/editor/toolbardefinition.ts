import { Icons } from 'notesnook-editor/dist/es/toolbar/icons';
import { DEFAULT_TOOLS, getAllTools } from 'notesnook-editor/dist/es/toolbar/tooldefinitions';
import { ToolId } from 'notesnook-editor/dist/es/toolbar/tools';
import { ToolbarGroupDefinition } from 'notesnook-editor/dist/es/toolbar/index';
import { useThemeStore } from '../../../stores/use-theme-store';

export const tools = getAllTools();
export const presets: { [name: string]: ToolbarGroupDefinition[] } = {
  default: DEFAULT_TOOLS,
  minimal: [...DEFAULT_TOOLS.slice(0, 2)],
  custom: [DEFAULT_TOOLS.slice(0)]
};

export function findToolById(id: keyof typeof tools): { title: string; icon: string } {
  return tools[id];
}

export function getToolIcon(id: keyof typeof tools) {
  //@ts-ignore
  const icon = Icons[id];
  const colors = useThemeStore.getState().colors;
  //@ts-ignore
  return id === 'none'
    ? null
    : `<svg width="20" height="20"  >
  <path d="${icon}" fill="${colors.icon}" />
</svg>`;
}

export function getUngroupedTools(toolDefinition: (string | string[])[][]): string[] {
  let keys = Object.keys(tools);
  console.log(keys);
  const ungrouped = [];
  let toolString = JSON.stringify(toolDefinition);
  for (let key of keys) {
    if (tools[key as ToolId].conditional) continue;
    if (!toolString.includes(key)) ungrouped.push(key);
  }
  console.log(ungrouped);
  return ungrouped;
}
