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

import { createRef } from "react";
import type { SxProp } from "./style";
import { dataColor } from "./style";
import type {
  UIElement,
  UIInputElement,
  UISelectElement,
  UITextAreaElement
} from "./elements";
import type {
  ContextMenuEvent,
  FocusEvent,
  HoverEvent,
  KeyEvent,
  PressEvent,
  UIChangeEvent,
  UIDragEvent,
  UIKeyboardEvent,
  UIMouseEvent
} from "./events";
import { Dialog, DialogButton, Modal } from "./dialog";
import { Pane, ScrollContainer, SplitPane } from "./layout";
import {
  GroupedVirtuoso,
  TableVirtuoso,
  VirtualList,
  Virtuoso,
  type Components,
  type VirtualListHandle,
  type VirtualListProps,
  type VirtuosoHandle
} from "./lists";
import {
  Box,
  Button,
  Checkbox,
  Flex,
  Grid,
  Image,
  Input,
  Label,
  Link,
  Radio,
  Select,
  Slider,
  Switch,
  Text,
  Textarea,
  ThemeScope
} from "./primitives";
import {
  MenuPresenter,
  Popover,
  PopupPresenter,
  ResponsivePresenter,
  type MenuItem,
  type PositionOptions
} from "./overlays";

export const overlays = [
  <Popover
    key="1"
    isOpen
    onClose={() => undefined}
    anchorRect={{ x: 0, y: 0, width: 10, height: 10 }}
  />,
  <ResponsivePresenter
    key="2"
    isOpen
    onClose={() => undefined}
    anchorRect={{ x: 0, y: 0, width: 10, height: 10 }}
    sheetBreakpoint={500}
  />
];

export const valid: SxProp = {
  display: "flex",
  flexDirection: ["column", "row"],
  alignItems: "center",
  p: 2,
  mt: "spacing3",
  bg: "background-secondary",
  color: "paragraph",
  borderRadius: "default",
  border: "1px solid",
  fontSize: "body",
  ":hover": { bg: "hover", borderColor: "border" },
  ":group-hover": { group: "row", style: { opacity: 1 } }
};

export const selector: SxProp = {
  // @ts-expect-error selectors are not part of the contract
  "&:hover svg path": { fill: "icon" }
};

export const classSelector: SxProp = {
  // @ts-expect-error class selectors are not part of the contract
  ".active": { color: "accent" }
};

export const nestedState: SxProp = {
  // @ts-expect-error only the listed state keys exist
  ":first-of-type": { color: "accent" }
};

export const mediaQuery: SxProp = {
  // @ts-expect-error responsive values are arrays, not media queries
  "@media (max-width: 480px)": { display: "none" }
};

export const cssVariable: SxProp = {
  // @ts-expect-error raw CSS variables are not tokens
  color: "var(--paragraph)"
};

export const unknownToken: SxProp = {
  // @ts-expect-error not a theme colour
  bg: "not-a-theme-color"
};

export const unsupportedUnit: SxProp = {
  // @ts-expect-error rem is not a supported unit
  width: "10rem"
};

export const unsupportedDisplay: SxProp = {
  // @ts-expect-error only flex and none are display values
  display: "block"
};

export const dataColors: SxProp = {
  bg: dataColor("#ff0000"),
  borderLeftColor: dataColor("#00ff00")
};

export const rawColorString: SxProp = {
  // @ts-expect-error a raw string is not a colour value, use dataColor
  bg: "#ff0000"
};

export const outline: SxProp = {
  outlineColor: "accent",
  outlineWidth: 2,
  outlineOffset: 1
};

export const outlineShorthand: SxProp = {
  // @ts-expect-error outline needs a colour too
  outline: "2px solid"
};

export const stateOutline: SxProp = {
  ":focus-visible": { outlineColor: "accent", outlineWidth: 2 }
};

export const motion: SxProp = {
  opacity: 0,
  transition: { property: ["opacity", "transform"], duration: 200 },
  animation: {
    keyframes: { from: { opacity: 0 }, to: { opacity: 1 } },
    duration: 300,
    iterationCount: "infinite"
  }
};

export const transitionOnState: SxProp = {
  // @ts-expect-error state styles change instantly, they take no transition
  ":hover": { transition: { property: "opacity", duration: 100 } }
};

export const animatedProperty: SxProp = {
  // @ts-expect-error only opacity, transform and colours animate
  transition: { property: "width", duration: 100 }
};

export const stateWithLayout: SxProp = {
  // @ts-expect-error state styles only change visual properties
  ":hover": { width: 10 }
};

export const elements = [
  <Box key="1" sx={valid} bg="background" p={2} />,
  <Flex key="2" mt={1} />,
  <Text key="3" variant="body" color="paragraph" />,
  <Button key="4" variant="accent" onClick={(e) => e.stopPropagation()} />,
  <Input key="5" onChange={(event) => event.target.value.length} />,
  <ThemeScope key="6" scope="navigationMenu" />,
  <SplitPane key="13" direction="vertical" autoSaveId="global">
    <Pane id="nav" initialSize={250} minSize={50} snapSize={150} />
    <Pane id="editor" />
  </SplitPane>,
  <VirtualList
    key="14"
    count={10}
    itemKey={(index) => `${index}`}
    renderItem={() => null}
    estimatedItemSize={40}
  />,
  // @ts-expect-error a list needs its item size estimate
  <VirtualList key="15" count={1} itemKey={() => ""} renderItem={() => null} />,
  // @ts-expect-error pane sizes are numbers
  <Pane key="16" id="x" initialSize="250px" />,
  <Grid key="10" columns={7} gap={1} rowGap={2} />,
  // @ts-expect-error grids are equal columns, not template strings
  <Grid key="11" columns="1fr 1fr" />,
  // @ts-expect-error columns is required
  <Grid key="12" />,
  <Box key="7" className="selectable" />,
  <Box key="8" style={{ flex: 1 }} />,
  // @ts-expect-error raw colour strings are not tokens
  <Box key="9" bg="#ff0000" />
];

const boxRef = createRef<UIElement>();
const inputRef = createRef<UIInputElement>();
const textareaRef = createRef<UITextAreaElement>();
const selectRef = createRef<UISelectElement>();
const listRef = createRef<VirtuosoHandle>();

function readMouse(event: UIMouseEvent) {
  event.preventDefault();
  event.stopPropagation();
  return [
    event.target,
    event.currentTarget.getBoundingClientRect().top,
    event.clientX + event.clientY + event.pageX + event.pageY,
    event.button === 0,
    event.ctrlKey || event.metaKey || event.shiftKey || event.altKey
  ];
}

function readKey(event: UIKeyboardEvent) {
  event.preventDefault();
  return event.key === "Enter" && event.code === "Enter" && !event.repeat;
}

function readDrop(event: UIDragEvent) {
  return event.dataTransfer.files.length + event.clientX;
}

function readChange(event: UIChangeEvent<UIInputElement>) {
  return [event.target.value, event.target.checked, event.currentTarget];
}

export function elementSubset(element: UIElement, input: UIInputElement) {
  element.focus();
  element.blur();
  element.scrollIntoView({ block: "nearest" });
  element.scrollTop = 0;
  input.select();
  return (
    element.contains(input) &&
    element.getBoundingClientRect().width > input.value.length
  );
}

export const webShaped = [
  <Box
    key="1"
    ref={boxRef}
    as="span"
    id="box"
    title="Title"
    className="selectable"
    style={{ flex: 1, transform: "translateX(1px)" }}
    sx={{ flexDirection: "column" }}
    data-test-id="box"
    data-index={1}
    aria-label="Box"
    tabIndex={0}
    draggable
    onClick={readMouse}
    onAuxClick={readMouse}
    onDoubleClick={readMouse}
    onContextMenu={readMouse}
    onMouseEnter={readMouse}
    onMouseLeave={readMouse}
    onMouseDown={readMouse}
    onMouseUp={readMouse}
    onMouseMove={readMouse}
    onKeyDown={readKey}
    onKeyUp={readKey}
    onFocus={(event) => event.target.focus()}
    onBlur={(event) => event.currentTarget.blur()}
    onDragOver={(event) => event.preventDefault()}
    onDrop={readDrop}
    onWheel={(event) => event.deltaX + event.deltaY}
  />,
  <Flex
    key="2"
    as="form"
    onSubmit={(event) => {
      event.preventDefault();
    }}
  />,
  <Text key="3" as="a" href="https://notesnook.com" target="_blank" />,
  <Text key="4" sx={{ lineClamp: 2 }} />,
  <Text
    key="4b"
    sx={{
      textDecoration: "underline",
      textDecorationColor: "accent",
      overflowWrap: "anywhere",
      wordWrap: "break-word",
      overflowX: "auto",
      overflowY: "hidden",
      inset: 0,
      size: 20,
      background: "background",
      borderStyle: "solid",
      borderBottomWidth: 1,
      borderRightWidth: 1,
      outline: "none",
      visibility: "hidden"
    }}
  />,
  <Text key="5" dangerouslySetInnerHTML={{ __html: "<b>bold</b>" }} />,
  <Image key="6" src="a.png" alt="A" sx={{ objectFit: "contain" }} />,
  <Input
    key="7"
    ref={inputRef}
    type="number"
    name="count"
    min={1}
    max={10}
    step={1}
    onChange={(event) => event.target.valueAsNumber + event.target.value.length}
    onKeyUp={(event) => event.currentTarget.value}
  />,
  <Textarea
    key="8"
    ref={textareaRef}
    rows={3}
    spellCheck={false}
    onChange={(event) => event.target.value.trim()}
  />,
  <Checkbox key="9" ref={inputRef} onChange={readChange} />,
  <Radio key="10" onChange={(event) => event.target.checked} />,
  <Switch key="11" onChange={(event) => event.currentTarget.checked} />,
  <Slider key="12" onChange={(event) => event.target.valueAsNumber} />,
  <Select
    key="13"
    ref={selectRef}
    value="a"
    onChange={(event) => event.target.value.toUpperCase()}
  >
    <option value="a">A</option>
    <option value="b">B</option>
  </Select>,
  <Label key="14" htmlFor="box" />,
  <Link key="15" href="https://notesnook.com" target="_blank" rel="noreferrer" />,
  <Button key="16" type="submit" data-test-id="submit" />
];

const listComponents: Components<string, { selected: string }> = {
  Scroller: (props) => <Box ref={props.ref} style={props.style} />,
  Item: (props) => <Box data-index={props["data-index"]}>{props.children}</Box>,
  Header: (props) => <Text>{props.context.selected}</Text>
};

export const lists = [
  <Virtuoso
    key="1"
    ref={listRef}
    data={["a", "b"]}
    context={{ selected: "a" }}
    computeItemKey={(index, item) => `${index}-${item}`}
    itemContent={(index, item, context) => (
      <Text>{item === context.selected ? index : item}</Text>
    )}
    components={listComponents}
    defaultItemHeight={40}
    increaseViewportBy={100}
    data-test-id="list"
    onKeyDown={(event) => event.nativeEvent.key}
  />,
  <Virtuoso key="2" totalCount={10} itemContent={(index) => index} />,
  <GroupedVirtuoso
    key="3"
    groupCounts={[2, 3]}
    groupContent={(index) => index}
    itemContent={(index, groupIndex) => index + groupIndex}
  />,
  <TableVirtuoso
    key="4"
    data={[1, 2]}
    fixedHeaderContent={() => null}
    itemContent={(index, item) => index + item}
  />,
  // @ts-expect-error itemContent gets the index first, then the item
  <Virtuoso key="5" data={["a"]} itemContent={(item: string) => item} />
];

export function scrollList(handle: VirtuosoHandle) {
  handle.scrollToIndex(3);
  handle.scrollToIndex({ index: 3, align: "center", behavior: "smooth" });
  handle.scrollIntoView({
    index: 3,
    calculateViewLocation: ({ itemTop, viewportTop }) =>
      itemTop < viewportTop ? { index: 3, align: "start" } : null
  });
  // @ts-expect-error the index is a number or "LAST"
  handle.scrollToIndex({ index: "first" });
}

Modal.setAppElement("#root");

export const modals = [
  <Modal
    key="1"
    isOpen
    onRequestClose={() => undefined}
    onAfterOpen={() => undefined}
    shouldCloseOnEsc
    shouldReturnFocusAfterClose
    shouldFocusAfterRender={false}
    overlayClassName="theme-scope-dialog"
    data={{ "test-id": "dialog" }}
    style={{
      content: { position: "relative", overflow: "hidden" },
      overlay: { zIndex: 999, backgroundColor: "#00000022" }
    }}
  >
    <Box />
  </Modal>,
  // @ts-expect-error isOpen is required, as in react-modal
  <Modal key="2" />
];

const menuItems: MenuItem[] = [
  { type: "button", key: "open", title: "Open", onClick: () => undefined },
  { type: "separator", key: "sep" },
  {
    type: "button",
    key: "more",
    title: "More",
    menu: { items: [{ type: "button", key: "nested", title: "Nested" }] }
  },
  { type: "lazy-loader", key: "lazy", items: async () => [] }
];

const menuPosition: PositionOptions = {
  target: "mouse",
  location: "below",
  align: "start",
  yOffset: 5
};

export const menus = [
  <MenuPresenter
    key="1"
    isOpen
    onClose={() => undefined}
    items={menuItems}
    position={menuPosition}
    blocking
    focusOnRender
    title="Menu"
  />,
  <PopupPresenter
    key="2"
    isOpen
    onClose={() => undefined}
    position={{ target: boxRef.current, location: "right" }}
    sx={{ boxShadow: "menu" }}
  />,
  <ScrollContainer
    key="3"
    className="scroll"
    style={{ height: 100 }}
    suppressScrollX
    trackStyle={() => ({ backgroundColor: "transparent" })}
    onWheel={(event) => event.deltaY}
  />
];

export const deprecatedAliases = [
  <Button
    key="1"
    testID="button"
    onPress={(event) => event.x + event.y}
    onHoverIn={(event) => event.pageX}
    onHoverOut={(event) => event.pageY}
  />,
  <Input
    key="2"
    onChangeText={(text) => text.length}
    onSubmitEditing={(text) => text.length}
  />,
  <Text key="3" numberOfLines={1} />,
  <Image key="4" src="a.png" resizeMode="cover" />,
  <Checkbox key="5" onCheckedChange={(checked) => !checked} />,
  <Switch key="6" onCheckedChange={(checked) => !checked} />,
  <Slider key="7" onValueChange={(value) => value + 1} />,
  <Select
    key="8"
    options={[{ value: "a", title: "A" }]}
    onValueChange={(value) => value.length}
  />,
  <Box key="9" droppable onDropFiles={(files) => files.length} />,
  <Dialog key="10" testID="dialog" isOpen />,
  <Radio key="11" onCheckedChange={(checked) => !checked} />,
  <Textarea key="12" onChangeText={(text) => text.length} />,
  <Box key="13" acceptsFiles={["image/png"]} />,
  <Box
    key="14"
    onDrop={(event) => [event.payload, event.x + event.y, event.dropped]}
  />,
  <VirtualList
    key="15"
    count={1}
    renderItem={() => null}
    itemKey={() => ""}
    estimatedItemSize={10}
    testID="list"
  />,
  <DialogButton key="16" text="OK" testID="ok" onClick={() => undefined} />
];

export function deprecatedMeasure(element: UIElement) {
  element.measureInWindow((x, y, width, height) => x + y + width + height);
}

export function deprecatedEventTypes(
  press: PressEvent,
  hover: HoverEvent,
  key: KeyEvent,
  focus: FocusEvent,
  menu: ContextMenuEvent
) {
  return [press.x + press.y, hover.pageX, key.key, focus.target, menu.clientX];
}

export function deprecatedListTypes(handle: VirtualListHandle) {
  return handle.scrollToIndex;
}

export const deprecatedListProps: VirtualListProps = {
  count: 1,
  renderItem: () => null,
  itemKey: () => "",
  estimatedItemSize: 10
};

export const strict = [
  // @ts-expect-error onChange delivers an event, not the checked value
  <Checkbox key="1" onChange={(checked: boolean) => !checked} />,
  // @ts-expect-error onChange delivers an event, not the text
  <Input key="2" onChange={(text: string) => text.length} />,
  // @ts-expect-error lineClamp is a number of lines
  <Text key="3" sx={{ lineClamp: "2" }} />,
  // @ts-expect-error only cover, contain and fill can be drawn
  <Image key="4" src="a.png" sx={{ objectFit: "scale-down" }} />,
  // @ts-expect-error desktop has no canvas element
  <Box key="5" as="canvas" />,
  // @ts-expect-error inline style takes the properties desktop can draw
  <Box key="6" style={{ float: "left" }} />,
  // @ts-expect-error inline style display is flex or none
  <Box key="7" style={{ display: "grid" }} />,
  // @ts-expect-error an input's ref needs the input element
  <Input key="8" ref={boxRef} />
];
