import { Group } from "./group";
import { DraggableItem } from "./state";
import { Tool } from "./tool";

export const renderTool = ({
  item,
  groupIndex,
  parentIndex
}: DraggableItem) => {
  const data = item as string[];

  if (!data) return null;

  const tools = data.map((item, index) => (
    <Tool
      key={Array.isArray(item) ? `subgroup-${index}` : item}
      item={item}
      index={index}
      groupIndex={groupIndex}
      parentIndex={parentIndex}
    />
  ));

  if (Array.isArray(data[0])) {
    tools.unshift(
      <Tool
        key={"dummy"}
        item={"dummy"}
        index={-1}
        groupIndex={groupIndex}
        parentIndex={parentIndex}
      />
    );
  }

  return tools;
};

export const renderGroup = ({ item, index, parentIndex }: DraggableItem) => (
  <Group item={item} index={index} parentIndex={parentIndex} />
);
