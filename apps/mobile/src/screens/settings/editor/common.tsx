import React from 'react';
import { Group } from './group';
import { DraggableItem } from './state';
import { Tool } from './tool';

export const renderTool = ({ item, groupIndex, parentIndex }: DraggableItem) => {
  const data = item as string[];
  return data.map((item, index) => (
    <Tool
      key={Array.isArray(item) ? `subgroup-${index}` : item}
      item={item}
      index={index}
      groupIndex={groupIndex}
      parentIndex={parentIndex}
    />
  ));
};

export const renderGroup = ({ item, index, parentIndex }: DraggableItem) => (
  <Group item={item} index={index} parentIndex={parentIndex} />
);
