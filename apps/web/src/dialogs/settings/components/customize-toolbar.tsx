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

import { Button, Flex, FlexProps, Text } from "@theme-ui/components";
import {
  getAllTools,
  getToolDefinition,
  Icons,
  ToolbarDefinition,
  ToolbarGroupDefinition,
  ToolId
} from "@notesnook/editor";
import {
  closestCenter,
  DndContext,
  useSensor,
  useSensors,
  KeyboardSensor,
  PointerSensor,
  DragOverlay,
  MeasuringStrategy
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { useEffect, useState } from "react";
import { CSS } from "@dnd-kit/utilities";
import { createPortal } from "react-dom";
import { getId } from "@notesnook/core";
import { Label } from "@theme-ui/components";
import { db } from "../../../common/db";
import { useToolbarConfig } from "../../../components/editor/manager";
import {
  getAllPresets,
  getCurrentPreset,
  getPreset,
  getPresetTools,
  Preset,
  PresetId
} from "../../../common/toolbar-config";
import { showToast } from "../../../utils/toast";
import { isUserPremium } from "../../../hooks/use-is-user-premium";
import { Pro } from "../../../components/icons";

import { Icon } from "@notesnook/ui";
import { CURRENT_TOOLBAR_VERSION } from "@notesnook/common";
import { strings } from "@notesnook/intl";

export function CustomizeToolbar() {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );
  const [items, setItems] = useState<TreeNode[]>([]);
  const [activeItem, setActiveItem] = useState<TreeNode>();
  const [currentPreset, setCurrentPreset] = useState<Preset>();
  const { setToolbarConfig } = useToolbarConfig();

  useEffect(() => {
    if (!currentPreset) return;
    const items = flatten(getPresetTools(currentPreset));
    items.push(createTrash());
    items.push(...flatten([getDisabledTools(items)]).slice(1));
    setItems(items);
  }, [currentPreset]);

  useEffect(() => {
    (async () => {
      const preset = await getCurrentPreset();
      setCurrentPreset(preset);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!currentPreset) return;
      const tools = unflatten(items).slice(0, -1);

      await db.settings.setToolbarConfig("desktop", {
        version: CURRENT_TOOLBAR_VERSION,
        preset: currentPreset.id,
        config: currentPreset.id === "custom" ? tools : undefined
      });

      setToolbarConfig(tools);
    })();
  }, [items]);

  if (!currentPreset) return null;
  return (
    <Flex sx={{ flexDirection: "column" }}>
      <Flex
        sx={{ py: 2, justifyContent: "space-between", alignItems: "center" }}
      >
        <Flex sx={{ gap: 2 }}>
          {getAllPresets().map((preset) => (
            <Label
              key={preset.id}
              variant="text.body"
              sx={{
                alignItems: "center",
                width: "auto"
              }}
            >
              <input
                id={preset.id.toString()}
                name="preset"
                type="radio"
                value={preset.id}
                checked={preset.id === currentPreset.id}
                defaultChecked={preset.id === currentPreset.id}
                disabled={preset.id === "custom" && !isUserPremium()}
                style={{ accentColor: "var(--accent)" }}
                onChange={async (e) => {
                  const { value } = e.target;
                  if (preset.id === "custom" && !isUserPremium()) {
                    showToast(
                      "info",
                      strings.upgradeToProToUseFeature("customPresets")
                    );
                    return;
                  }
                  console.log("CHANGE PRESET", value);
                  setCurrentPreset(getPreset(value as PresetId));
                }}
              />
              <span
                style={{
                  marginLeft: 5,
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}
              >
                {preset.title}
              </span>
              {preset.id === "custom" && !isUserPremium() ? (
                <Pro color="accent" size={18} sx={{ ml: 1 }} />
              ) : null}
            </Label>
          ))}
        </Flex>
        {currentPreset.editable && (
          <Button
            variant={"secondary"}
            sx={{
              display: "flex",
              flexShrink: 0,
              alignItems: "center",
              p: 1
            }}
            title={strings.createAGroup()}
            onClick={() => {
              setItems(addGroup);
              showToast("success", strings.groupAdded());
            }}
          >
            <Icon path={Icons.plus} color="paragraph" size={18} />
          </Button>
        )}
      </Flex>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        cancelDrop={() => {
          if (!isUserPremium()) {
            showToast(
              "error",
              strings.upgradeToProToUseFeature("customizeToolbar")
            );
            return true;
          }
          return false;
        }}
        onDragStart={(event) => {
          if (currentPreset.id !== "custom") {
            setCurrentPreset({
              ...getPreset("custom"),
              tools: getPresetTools(currentPreset)
            });
          }

          const { active } = event;
          const activeItem = items.find((item) => item.id === active.id);
          setActiveItem(activeItem);
        }}
        onDragEnd={(event) => {
          const { active, over } = event;
          if (activeItem && over && active.id !== over.id) {
            // const newIndex = items.findIndex((i) => i.id === over.id);
            if (isGroup(activeItem) || isSubgroup(activeItem)) {
              setItems(moveGroup(items, activeItem.id, over.id as string));
            } else {
              setItems(moveItem(items, activeItem.id, over.id as string));
            }

            setTimeout(() => {
              const element = document.getElementById(over.id as string);
              element?.scrollIntoView({ behavior: "auto", block: "nearest" });
            }, 500);
          }
          setActiveItem(undefined);
        }}
        measuring={{
          droppable: { strategy: MeasuringStrategy.Always }
        }}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          {items?.map((item) => {
            const deleted = isDeleted(items, item);
            const hasSubGroup =
              isGroup(item) &&
              !!getGroup(items, item.id)?.items.some((t) => isSubgroup(t));
            const canAddSubGroup =
              currentPreset.editable && !deleted && !hasSubGroup;
            const canRemoveGroup = currentPreset.editable && !deleted;
            const canRemoveItem = currentPreset.editable && !deleted;

            return (
              <TreeNodeComponent
                key={item.id}
                item={item}
                activeItem={activeItem}
                onAddSubGroup={
                  canAddSubGroup
                    ? () => {
                        setItems((items) => addSubGroup(items, item.id));
                        showToast("success", strings.subgroupAdded());
                      }
                    : undefined
                }
                onRemoveGroup={
                  canRemoveGroup
                    ? (group) => {
                        setItems(removeGroup(items, group.id));
                      }
                    : undefined
                }
                onRemoveItem={
                  canRemoveItem
                    ? (item) => {
                        setItems(removeItem(items, item.id));
                      }
                    : undefined
                }
              />
            );
          })}
          {activeItem &&
            createPortal(
              <DragOverlay
              // dropAnimation={dropAnimationConfig}
              // modifiers={indicator ? [adjustTranslate] : undefined}
              >
                <TreeNodeComponent overlay item={activeItem} />
              </DragOverlay>,
              document.querySelector(".ReactModal__Overlay") || document.body
            )}
        </SortableContext>
      </DndContext>
    </Flex>
  );
}
type TreeNodeComponentProps = {
  item: TreeNode;
  activeItem?: TreeNode;
  overlay?: boolean;
  onRemoveGroup?: (item: TreeNode) => void;
  onAddSubGroup?: () => void;
  onRemoveItem?: (item: TreeNode) => void;
};
function TreeNodeComponent(props: TreeNodeComponentProps) {
  const {
    item,
    activeItem,
    onRemoveGroup,
    onRemoveItem,
    onAddSubGroup,
    ...restProps
  } = props;
  if (activeItem && isCollapsed(item, activeItem)) return null;
  const isDraggable = !isTrash(item);

  if (isGroup(item) || isSubgroup(item)) {
    return (
      <SortableWrapper
        {...restProps}
        item={item}
        draggable={isDraggable}
        onRemove={onRemoveGroup}
        onAdd={isGroup(item) ? onAddSubGroup : undefined}
        sx={{
          bg: "var(--background-secondary)",
          borderRadius: "default",
          p: 1,
          mb: 1,
          ml: item.depth * 15,
          alignItems: "center"
        }}
      >
        {isDraggable ? (
          <Icon path={Icons.dragHandle} size={18} color="accent" />
        ) : null}
        <Text variant={"body"} sx={{ ml: 1, color: "accent" }}>
          {item.title}
        </Text>
      </SortableWrapper>
    );
  }

  return (
    <SortableWrapper
      {...restProps}
      item={item}
      draggable={isDraggable}
      onRemove={onRemoveItem}
      sx={{
        p: 1,
        alignItems: "center",
        justifyContent: "space-between",
        bg: "var(--background-secondary)",
        borderRadius: "default",
        mb: 1,
        ml: item.depth * 15,
        ":last-of-type": { mb: 0 }
      }}
    >
      {item.icon && (
        <Icon
          path={(Icons as Record<string, string>)[item.icon]}
          size={16}
          color="icon"
        />
      )}
      <Text variant={"body"} sx={{ ml: 1 }}>
        {item.title}
      </Text>
    </SortableWrapper>
  );
}

type SortableWrapperProps = TreeNodeComponentProps &
  FlexProps & { onRemove?: (item: TreeNode) => void; onAdd?: () => void };

function SortableWrapper(props: SortableWrapperProps) {
  const {
    item,
    activeItem,
    overlay,
    sx,
    children,
    draggable,
    onRemove,
    onAdd,
    ...flexProps
  } = props;
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });
  const visibility =
    !overlay && item.id === activeItem?.id ? "hidden" : "visible";

  return (
    <Flex
      {...flexProps}
      id={overlay ? `overlay-${item.id}` : item.id}
      ref={setNodeRef}
      sx={{
        pointerEvents: draggable ? "all" : "none",
        cursor: overlay ? "grabbing" : draggable ? "grab" : "unset",
        visibility,
        transform: CSS.Transform.toString(transform),
        transition,
        justifyContent: "space-between",
        ":hover #remove-item, :hover #add-item": { opacity: 1 },
        ...sx
      }}
    >
      <Flex
        {...listeners}
        {...attributes}
        sx={{ alignItems: "center", flex: 1 }}
      >
        {children}
      </Flex>
      <Flex sx={{ alignItems: "center" }}>
        {onAdd && (
          <Button
            id="add-item"
            variant={"secondary"}
            sx={{ p: "small", opacity: 0, mr: 1 }}
            onClick={() => onAdd()}
          >
            <Icon path={Icons.plus} size={16} color="icon" />
          </Button>
        )}
        {onRemove && (
          <Button
            id="remove-item"
            variant={"secondary"}
            sx={{ p: "small", opacity: 0 }}
            onClick={() => onRemove(item)}
          >
            <Icon path={Icons.delete} size={16} color="icon" />
          </Button>
        )}
      </Flex>
    </Flex>
  );
}

type TreeNodeType = "group" | "item";
type BaseTreeNode<Type extends TreeNodeType> = {
  type: Type;
  id: string;
  title: string;
  depth: number;
};

type Subgroup = BaseTreeNode<"group"> & {
  collapsed?: boolean;
};

type Group = BaseTreeNode<"group">;

type Item = BaseTreeNode<"item"> & {
  toolId: ToolId;
  icon: string;
  collapsed?: boolean;
};

type TreeNode = Group | Item | Subgroup;

function flatten(tools: ToolbarGroupDefinition[], depth = 0): TreeNode[] {
  const nodes: TreeNode[] = [];
  let groupCount = 1;
  for (const tool of tools) {
    if (Array.isArray(tool)) {
      const isSubgroup = depth > 0;
      const groupTitle = `${isSubgroup ? "Subgroup" : "Group"} ${groupCount}`;

      nodes.push(createGroup({ depth, title: groupTitle }));
      nodes.push(...flatten(tool as ToolbarGroupDefinition[], depth + 1));
      ++groupCount;
    } else {
      const { icon, title } = getToolDefinition(tool);
      nodes.push(createItem({ toolId: tool, depth, title, icon }));
    }
  }
  return nodes;
}

function unflatten(items: TreeNode[]): ToolbarDefinition {
  const tools: ToolbarDefinition = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (isGroup(item) || isSubgroup(item)) {
      const group = getGroup(items, item.id);
      if (!group) continue;
      tools.push(unflatten(group.items.slice(1)) as ToolbarGroupDefinition);

      // skip all the group's items
      i += group.items.length - 1;
    } else {
      (tools as ToolbarGroupDefinition).push(item.toolId);
    }
  }
  return tools;
}

function createGroup(config: Partial<Group>): Group {
  return {
    type: "group",
    id: getId(),
    depth: 0,
    title: strings.group(),
    ...config
  };
}

function createItem(config: Partial<Item> & { toolId: ToolId }): Item {
  return {
    type: "item",
    id: getId(),
    depth: 0,
    title: "",
    icon: "",
    ...config
  };
}

function createTrash() {
  return createGroup({
    id: "trash",
    depth: 0,
    title: strings.disabled()
  });
}

function moveGroup(
  items: TreeNode[],
  fromId: string,
  toId: string
): TreeNode[] {
  const newArray = items.slice();
  const fromGroup = getGroup(items, fromId);
  const toGroup = getGroup(items, toId);

  if (!fromGroup || !toGroup || !canMoveGroup(fromGroup, toGroup)) return items;

  newArray.splice(fromGroup.index, fromGroup.items.length);
  const newIndex =
    // if we are moving the group upwards
    fromGroup.index > toGroup.index
      ? toGroup.index
      : toGroup.index + toGroup.items.length - fromGroup.items.length;

  newArray.splice(
    newIndex,
    0,
    ...fromGroup.items.map((item) => {
      if (item.depth) item.depth = toGroup.item.depth + 1;
      return item;
    })
  );
  return newArray;
}

function canMoveGroup(
  fromGroup: ResolvedGroup,
  toGroup: ResolvedGroup
): boolean {
  const hasOtherGroups =
    toGroup.items.filter((item) => isGroup(item) || isSubgroup(item)).length >
    1;

  // 1 group can contain only 1 subgroup
  if (isSubgroup(fromGroup.item) && hasOtherGroups) return false;

  return true;
}

function moveItem(items: TreeNode[], fromId: string, toId: string): TreeNode[] {
  const fromIndex = items.findIndex((i) => i.id === fromId);
  const toIndex = items.findIndex((i) => i.id === toId);

  const fromItem = items[fromIndex];
  const toItem = items[toIndex];

  if (!fromItem || !isItem(fromItem)) return items;

  const movingToGroup = isGroup(toItem) || isSubgroup(toItem);

  // we need to adjust the item depth according to where the item
  // is going to be moved.
  if (fromItem.depth !== toItem.depth) fromItem.depth = toItem.depth;

  // if we are moving to the start of the group, we need to adjust the
  // depth accordingly.
  if (movingToGroup) fromItem.depth = toItem.depth + 1;

  const newArray = arrayMove(items, fromIndex, toIndex);

  // do not allow moving an item if there's no group over it
  const itemGroup = getItemGroup(newArray, fromItem);
  if (!isGroup(itemGroup) && !isSubgroup(itemGroup)) return items;

  return newArray;
}

function removeGroup(items: TreeNode[], groupId: string): TreeNode[] {
  const newArray = items.slice();
  const fromGroup = getGroup(items, groupId);
  const toGroup = getGroup(items, "trash");

  if (!fromGroup || !toGroup) return items;

  newArray.splice(fromGroup.index, fromGroup.items.length);
  const newIndex =
    // if we are moving the group upwards
    fromGroup.index > toGroup.index
      ? toGroup.index
      : toGroup.index + toGroup.items.length - fromGroup.items.length;

  newArray.splice(
    newIndex,
    0,
    ...fromGroup.items
      .filter((item) => isItem(item))
      .map((item) => {
        item.depth = toGroup.item.depth + 1;
        return item;
      })
  );
  return newArray;
}

function removeItem(items: TreeNode[], itemId: string): TreeNode[] {
  const toGroup = getGroup(items, "trash");
  if (!toGroup) return items;

  return moveItem(
    items,
    itemId,
    toGroup.items.length > 0
      ? toGroup.items[toGroup.items.length - 1].id
      : toGroup.item.id
  );
}

function isCollapsed(item: TreeNode, activeItem: TreeNode): boolean {
  // if a group is selected, we collapse everything else.
  if (isGroup(activeItem) && (isSubgroup(item) || isItem(item))) {
    return true;
  }

  // if a subgroup is selected, we collapse only the items.
  if (isSubgroup(activeItem) && isItem(item)) return true;

  if (item.id === activeItem.id) return true;

  return false;
}

function isSubgroup(item: TreeNode): item is Subgroup {
  return item.type === "group" && item.depth > 0;
}

function isGroup(item: TreeNode): item is Group {
  return item.type === "group" && item.depth === 0;
}

function isItem(item: TreeNode): item is Item {
  return item.type === "item";
}

function isTrash(item: TreeNode): boolean {
  return item.id === "trash";
}

function isDeleted(items: TreeNode[], item: TreeNode): boolean {
  const group = getItemGroup(items, item);
  return group.id === "trash";
}

function getItemGroup(items: TreeNode[], item: TreeNode) {
  const index = items.findIndex((i) => i.id === item.id);
  for (let i = index; i >= 0; --i) {
    const item = items[i];
    if (isGroup(item) || isSubgroup(item)) return item;
  }
  return items[0];
}

type ResolvedGroup = {
  index: number;
  item: Group;
  items: TreeNode[];
};
function getGroup(items: TreeNode[], groupId: string): ResolvedGroup | null {
  const index = items.findIndex((item) => item.id === groupId);
  const group = items[index];
  if (!isGroup(group) && !isSubgroup(group)) return null;

  const nextGroupIndex = items.findIndex(
    (item, i) => i > index && (item.depth === 0 || item.depth < group.depth)
  );
  return {
    index,
    item: group,
    items: items.slice(
      index,
      nextGroupIndex < 0 ? items.length : nextGroupIndex
    )
  };
}

function addSubGroup(items: TreeNode[], groupId: string) {
  const group = getGroup(items, groupId);
  if (!group) return items;
  const newArray = items.slice();
  newArray.splice(
    group.index + group.items.length,
    0,
    createGroup({ title: strings.subgroupOne(), depth: 1 })
  );
  return newArray;
}

function addGroup(items: TreeNode[]) {
  let insertIndex = items.length;
  const trashIndex = items.findIndex((item) => isTrash(item));
  if (trashIndex > -1) insertIndex = trashIndex;

  const newArray = items.slice();
  const groups = items.filter((t) => isGroup(t) && !isSubgroup(t));
  const newGroup = createGroup({ title: `Group ${groups.length}` });
  newArray.splice(insertIndex, 0, newGroup);
  return newArray;
}

function getDisabledTools(tools: TreeNode[]) {
  const allTools = getAllTools();
  const disabled: ToolbarGroupDefinition = [];
  const items: Item[] = tools.filter((t) => isItem(t)) as Item[];
  for (const key in allTools) {
    const tool = allTools[key as ToolId];
    if (tool.conditional) continue;

    const isDisabled = items.findIndex((t) => t.toolId === key);
    if (isDisabled === -1 && key !== "none") disabled.push(key as ToolId);
  }
  return disabled;
}
