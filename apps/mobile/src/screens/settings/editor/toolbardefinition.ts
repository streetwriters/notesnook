import { Icons } from 'notesnook-editor/dist/toolbar/icons';
import { useThemeStore } from '../../../stores/use-theme-store';
import { ToolbarGroupDefinition, ToolDefinition } from 'notesnook-editor/dist/toolbar/types';
import { ToolId } from 'notesnook-editor/dist/toolbar/tools';

export const presets: { [name: string]: ToolbarGroupDefinition[] } = {
  default: [
    [
      'insertBlock',
      'tableSettings',
      'imageSettings',
      'embedSettings',
      'attachmentSettings',
      'linkSettings',
      'codeRemove'
    ],
    [
      'bold',
      'italic',
      'underline',
      ['strikethrough', 'code', 'subscript', 'superscript', 'highlight', 'textColor']
    ],
    ['fontSize'],
    ['headings', 'fontFamily'],
    ['numberedList', 'bulletList'],
    ['addLink'],
    ['alignCenter', ['alignLeft', 'alignRight', 'alignJustify', 'ltr', 'rtl']],
    ['clearformatting']
  ],
  minimal: [
    [
      'insertBlock',
      'tableSettings',
      'imageSettings',
      'embedSettings',
      'attachmentSettings',
      'linkSettings',
      'codeRemove'
    ],
    [
      'bold',
      'italic',
      'underline',
      ['strikethrough', 'subscript', 'superscript', 'highlight', 'textColor']
    ]
  ],
  custom: [
    [
      'insertBlock',
      'tableSettings',
      'imageSettings',
      'embedSettings',
      'attachmentSettings',
      'linkSettings',
      'codeRemove'
    ]
  ]
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

export const tools: Record<ToolId, ToolDefinition> = {
  bold: {
    icon: 'bold',
    title: 'Bold'
  },
  italic: {
    icon: 'italic',
    title: 'Italic'
  },
  underline: {
    icon: 'underline',
    title: 'Underline'
  },
  strikethrough: {
    icon: 'strikethrough',
    title: 'Strikethrough'
  },
  addLink: {
    icon: 'link',
    title: 'Link'
  },
  editLink: {
    icon: 'linkEdit',
    title: 'Edit link',
    conditional: true
  },
  removeLink: {
    icon: 'linkRemove',
    title: 'Remove link',
    conditional: true
  },
  openLink: {
    icon: 'openLink',
    title: 'Open link',
    conditional: true
  },
  linkSettings: {
    icon: 'linkSettings',
    title: 'Link settings',
    conditional: true
  },
  code: {
    icon: 'code',
    title: 'Code'
  },
  codeRemove: {
    icon: 'codeRemove',
    title: 'Code',
    conditional: true
  },
  clearformatting: {
    icon: 'formatClear',
    title: 'Clear all formatting'
  },
  subscript: {
    icon: 'subscript',
    title: 'Subscript'
  },
  superscript: {
    icon: 'superscript',
    title: 'Superscript'
  },
  insertBlock: {
    icon: 'plus',
    title: 'Insert'
  },
  bulletList: {
    icon: 'bulletList',
    title: 'Bullet list'
  },
  numberedList: {
    icon: 'numberedList',
    title: 'Numbered list'
  },
  fontFamily: {
    icon: 'none',
    title: 'Font family'
  },
  fontSize: {
    icon: 'none',
    title: 'Font size'
  },
  headings: {
    icon: 'none',
    title: 'Headings'
  },
  alignCenter: {
    icon: 'alignCenter',
    title: 'Align center'
  },
  alignLeft: {
    icon: 'alignLeft',
    title: 'Align left'
  },
  alignRight: {
    icon: 'alignRight',
    title: 'Align right'
  },
  alignJustify: {
    icon: 'alignJustify',
    title: 'Justify'
  },
  ltr: {
    icon: 'ltr',
    title: 'Left to right'
  },
  rtl: {
    icon: 'rtl',
    title: 'Right to left'
  },
  highlight: {
    icon: 'highlight',
    title: 'Highlight'
  },
  textColor: {
    icon: 'textColor',
    title: 'Text color'
  },

  tableSettings: {
    icon: 'tableSettings',
    title: 'Table settings',
    conditional: true
  },
  columnProperties: {
    icon: 'columnProperties',
    title: 'Column properties',
    conditional: true
  },
  rowProperties: {
    icon: 'rowProperties',
    title: 'Row properties',
    conditional: true
  },
  cellProperties: {
    icon: 'cellProperties',
    title: 'Cell properties',
    conditional: true
  },
  insertColumnLeft: {
    icon: 'insertColumnLeft',
    title: 'Insert column left',
    conditional: true
  },
  insertColumnRight: {
    icon: 'insertColumnRight',
    title: 'Insert column right',
    conditional: true
  },
  moveColumnLeft: {
    icon: 'moveColumnLeft',
    title: 'Move column left',
    conditional: true
  },
  moveColumnRight: {
    icon: 'moveColumnRight',
    title: 'Move column right',
    conditional: true
  },
  deleteColumn: {
    icon: 'deleteColumn',
    title: 'Delete column',
    conditional: true
  },
  splitCells: {
    icon: 'splitCells',
    title: 'Split cells',
    conditional: true
  },
  mergeCells: {
    icon: 'mergeCells',
    title: 'Merge cells',
    conditional: true
  },
  insertRowAbove: {
    icon: 'insertRowAbove',
    title: 'Insert row above',
    conditional: true
  },
  insertRowBelow: {
    icon: 'insertRowBelow',
    title: 'Insert row below',
    conditional: true
  },
  moveRowUp: {
    icon: 'moveRowUp',
    title: 'Move row up',
    conditional: true
  },
  moveRowDown: {
    icon: 'moveRowDown',
    title: 'Move row down',
    conditional: true
  },
  deleteRow: {
    icon: 'deleteRow',
    title: 'Delete row',
    conditional: true
  },
  deleteTable: {
    icon: 'deleteTable',
    title: 'Delete table',
    conditional: true
  },
  cellBackgroundColor: {
    icon: 'backgroundColor',
    title: 'Cell background color',
    conditional: true
  },
  cellBorderColor: {
    icon: 'cellBorderColor',
    title: 'Cell border color',
    conditional: true
  },
  cellTextColor: {
    icon: 'textColor',
    title: 'Cell text color',
    conditional: true
  },
  cellBorderWidth: {
    icon: 'none',
    title: 'Cell border width',
    conditional: true
  },

  imageSettings: {
    icon: 'imageSettings',
    title: 'Image settings',
    conditional: true
  },
  imageAlignCenter: {
    icon: 'alignCenter',
    title: 'Align center',
    conditional: true
  },
  imageAlignLeft: {
    icon: 'alignLeft',
    title: 'Align left',
    conditional: true
  },
  imageAlignRight: {
    icon: 'alignRight',
    title: 'Align right',
    conditional: true
  },
  imageProperties: {
    icon: 'more',
    title: 'Image properties',
    conditional: true
  },
  attachmentSettings: {
    icon: 'attachmentSettings',
    title: 'Attachment settings',
    conditional: true
  },
  downloadAttachment: {
    icon: 'download',
    title: 'Download attachment',
    conditional: true
  },
  removeAttachment: {
    icon: 'delete',
    title: 'Remove attachment',
    conditional: true
  },
  embedSettings: {
    icon: 'embedSettings',
    title: 'Embed settings',
    conditional: true
  },
  embedAlignCenter: {
    icon: 'alignCenter',
    title: 'Align center',
    conditional: true
  },
  embedAlignLeft: {
    icon: 'alignLeft',
    title: 'Align left',
    conditional: true
  },
  embedAlignRight: {
    icon: 'alignRight',
    title: 'Align right',
    conditional: true
  },
  embedProperties: {
    icon: 'more',
    title: 'Embed properties',
    conditional: true
  }
};
export const toolbarDefinition = presets['default'];

export type FlattenedToolbarItemType = {
  id: string;
  type: 'group' | 'tool' | 'subgroup';
  icon?: string;
  title: string;
  count?: number;
  groupId?: string;
};

export const getFlattenedToolbarDefinition = (
  toolbar: (string | string[])[][]
): FlattenedToolbarItemType[] => {
  const flattenedToolbar: FlattenedToolbarItemType[] = [];
  for (let group = 0; group < toolbar.length; group++) {
    const groupId = `group-${group + 1}`;
    flattenedToolbar.push({
      id: groupId,
      type: 'group',
      title: `Group ${group + 1}`
    });
    for (let i = 0; i < toolbar[group].length; i++) {
      let tool = toolbar[group][i];
      if (typeof tool !== 'string') {
        let subGroupId = `subgroup-${i + 1}-group`;
        flattenedToolbar.push({
          id: subGroupId,
          type: 'subgroup',
          title: `SubGroup ${group + 1}`,
          count: tool.length,
          groupId: groupId
        });
        for (let it = 0; it < tool.length; it++) {
          const toolId = tool[it] as keyof typeof tools;
          flattenedToolbar.push({
            type: 'tool',
            id: toolId,
            groupId: subGroupId,
            ...findToolById(toolId)
          });
        }
      } else {
        const toolId = tool as keyof typeof tools;
        flattenedToolbar.push({
          type: 'tool',
          id: toolId,
          groupId: groupId,
          ...findToolById(toolId)
        });
      }
    }
  }
  return flattenedToolbar;
};

export function getGroupIndexes(data: FlattenedToolbarItemType[]) {
  return data
    .map((item, index) => {
      if (item.type === 'group') return index;
      return -1;
    })
    .filter(item => item !== -1);
}

export function moveGroup(
  data: FlattenedToolbarItemType[],
  _data: FlattenedToolbarItemType[],
  to: number,
  from: number,
  prevDraggedItem: FlattenedToolbarItemType,
  nextDraggedItem: FlattenedToolbarItemType
) {
  const groupIndexes = getGroupIndexes(data);
  const nextGroupIndex = groupIndexes.findIndex(index => index === from) + 1;
  const prevGroupIndex = groupIndexes.findIndex(index => index === from) - 1;
  if (
    (to > groupIndexes[prevGroupIndex] && to < from) ||
    (to < groupIndexes[nextGroupIndex] && to > from) ||
    to === from
  ) {
    console.log('invalid location');
    return data;
  }

  const groupItems = data.slice(from + 1, groupIndexes[nextGroupIndex]);
  let { after, before } = getGroupBoundary(groupIndexes, to, from);
  console.log('group after drop index', after, 'group before drop index', before);
  let indexOfMovedGroup = _data.findIndex(item => item.id === prevDraggedItem.id);
  _data.splice(indexOfMovedGroup, 1);
  if (to < from) {
    // move up
    _data.splice(after === groupIndexes[0] ? after : before, 0, prevDraggedItem, ...groupItems);
    _data.splice(from + (groupItems.length + 1), groupItems.length);
  } else {
    // move down
    if (before === groupIndexes[groupIndexes.length - 1]) {
      if (after === before) before = _data.length - 1;
      _data.splice(before + 1, 0, prevDraggedItem, ...groupItems);
      _data.splice(from, groupItems.length);
    } else {
      _data.splice(before - 1, 0, prevDraggedItem, ...groupItems);
      _data.splice(from === 0 ? from : from - 1, groupItems.length);
    }
  }
  return _data;
}

export function getGroupBoundary(indexes: number[], to: number, from: number) {
  let after = 0;
  let before = 0;
  for (let i = 0; i < indexes.length; i++) {
    before = indexes[i];
    if (to >= after && to <= before) {
      if (before === to) {
        after = before;
        before = indexes[i + 1];
      }

      if (after === to && before === from) {
        before = after;
      }
      break;
    } else {
      after = before;
    }
  }
  return { after, before };
}

export const getToolbarDefinition = (
  flattenedToolbar: FlattenedToolbarItemType[]
): (string | string[])[][] => {
  const groupIndexes = flattenedToolbar
    .map((item, index) => {
      if (item.type === 'group') return index;
      return -1;
    })
    .filter(item => item !== -1);
  const toolbarDefinition = [];

  for (let i = 0; i < groupIndexes.length; i++) {
    let groupIndex = groupIndexes[i];
    let nextGroupIndex =
      i + 1 === groupIndexes.length ? flattenedToolbar.length : groupIndexes[i + 1];

    let groupDefinition = [];
    for (let i = groupIndex + 1; i < nextGroupIndex; i++) {
      let tool = flattenedToolbar[i];
      switch (tool.type) {
        case 'tool':
          if (!tool.groupId?.includes('subgroup')) {
            groupDefinition.push(tool.id);
          }
          break;
        case 'subgroup':
          // eslint-disable-next-line no-case-declarations
          let subgroupDefinition = [];
          for (let index = i + 1; index < nextGroupIndex; index++) {
            let subgroupTool = flattenedToolbar[index];
            if (subgroupTool.groupId !== tool.id) continue;
            subgroupDefinition.push(subgroupTool.id);
          }
          groupDefinition.push(subgroupDefinition);
          break;
      }
    }

    toolbarDefinition.push(groupDefinition);
  }
  return toolbarDefinition;
};

export const moveSubGroup = (
  data: FlattenedToolbarItemType[],
  _data: FlattenedToolbarItemType[],
  to: number,
  from: number,
  prevDraggedItem: FlattenedToolbarItemType,
  nextDraggedItem: FlattenedToolbarItemType
) => {
  const groupIndexes = getGroupIndexes(data);
  let { after, before } = getGroupBoundary(groupIndexes, to, from);
  console.log(after, before, 'value');
  if ((from > after && from < before && to !== after && to !== before) || to === from || to === 0) {
    console.log('invalid move');
    return _data;
  }
  const groupItems = data.slice(from + 1, getGroupBoundary(groupIndexes, from, to).before);

  let indexOfMovedGroup = _data.findIndex(item => item.id === prevDraggedItem.id);
  _data.splice(indexOfMovedGroup, 1);

  if (to < from) {
    // move up
    _data.splice(after === to ? after : before, 0, prevDraggedItem, ...groupItems);
    _data.splice(from + (groupItems.length + 1), groupItems.length);
  } else {
    // move down
    _data.splice(before - 1, 0, prevDraggedItem, ...groupItems);
    _data.splice(from, groupItems.length);
  }

  console.log(groupItems.map(i => i.id));

  return _data;
};

export const moveTool = (
  data: FlattenedToolbarItemType[],
  _data: FlattenedToolbarItemType[],
  to: number,
  from: number,
  prevDraggedItem: FlattenedToolbarItemType,
  nextDraggedItem: FlattenedToolbarItemType
) => {
  const itemAboveDrop = _data[to - 1];
  const isSubGroupOrItem =
    itemAboveDrop.id.startsWith('subgroup') || itemAboveDrop.groupId?.startsWith('subgroup');
  console.log(itemAboveDrop.id);
  if (isSubGroupOrItem) {
    console.log('dropped in subgroup', itemAboveDrop.type);
    _data[to].groupId =
      itemAboveDrop.type === 'subgroup' ? itemAboveDrop.id : itemAboveDrop.groupId;
  } else {
    _data[to].groupId = itemAboveDrop.type === 'group' ? itemAboveDrop.id : itemAboveDrop.groupId;
  }

  return _data;
};
