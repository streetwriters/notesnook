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

// Dev-only page: `npm run web`, then open `/?page=primitives`. It renders every
// `@notesnook/ui-kit` primitive, list and overlay in the web target with the app theme, and
// a light/dark toggle. It is not part of the app.

import { useRef, useState, type ReactNode } from "react";
import {
  Box,
  Button,
  Checkbox,
  ColorPicker,
  Flex,
  Grid,
  Icon,
  Image,
  Input,
  Label,
  LayoutRoot,
  Link,
  Pane,
  Popover,
  PopoverHost,
  Progress,
  QRCode,
  Radio,
  ScrollContainer,
  Select,
  SortableList,
  SplitPane,
  Slider,
  Switch,
  Text,
  Textarea,
  ThemeScope,
  ToastHost,
  Virtuoso,
  Modal,
  WebThemeProvider,
  showToast
} from "./ui";
import type { UIElement } from "@notesnook/ui-kit";
import { THEME_DARK, THEME_LIGHT } from "../../app/common/theme";

const STAR_PATH =
  "M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z";
const IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="32"><rect width="64" height="32" fill="#0560ff"/></svg>'
  );

function Section(props: { title: string; children: ReactNode }) {
  return (
    <Flex
      data-test-id={`primitive-${props.title}`}
      sx={{
        flexDirection: "column",
        gap: 2,
        p: 3,
        borderBottom: "1px solid",
        borderColor: "border"
      }}
    >
      <Text variant="subtitle" sx={{ color: "heading", fontWeight: "bold" }}>
        {props.title}
      </Text>
      <Flex sx={{ flexDirection: "row", gap: 3, flexWrap: "wrap" }}>
        {props.children}
      </Flex>
    </Flex>
  );
}

const ITEMS = Array.from({ length: 5000 }, (_, index) => ({
  id: `item-${index}`
}));

export function PrimitivesTestPage() {
  const [dark, setDark] = useState(false);
  const [text, setText] = useState("");
  const [checked, setChecked] = useState(true);
  const [radio, setRadio] = useState(false);
  const [on, setOn] = useState(true);
  const [slider, setSlider] = useState(40);
  const [color, setColor] = useState("#0560ff");
  const [choice, setChoice] = useState("b");
  const [dialog, setDialog] = useState(false);
  const [popover, setPopover] = useState(false);
  const [sortable, setSortable] = useState([
    { id: "one" },
    { id: "two" },
    { id: "three" }
  ]);
  const anchor = useRef<UIElement>(null);

  return (
    <WebThemeProvider theme={dark ? THEME_DARK : THEME_LIGHT}>
      <LayoutRoot>
        <ThemeScope scope="base">
          <Flex
            data-test-id="primitives-test-page"
            sx={{ flexDirection: "column", flex: 1, bg: "background" }}
          >
            <Flex sx={{ p: 3, gap: 2, alignItems: "center" }}>
              <Text sx={{ color: "heading", fontWeight: "bold", flex: 1 }}>
                @notesnook/ui-kit primitives (web target)
              </Text>
              <Button data-test-id="theme-toggle" onClick={() => setDark(!dark)}>
                <Text>{dark ? "Dark" : "Light"} theme</Text>
              </Button>
            </Flex>
            <ScrollContainer sx={{ flex: 1 }}>
              <Section title="Box, Flex, Grid">
                <Box sx={{ p: 2, bg: "background-secondary" }}>
                  <Text>Box</Text>
                </Box>
                <Flex sx={{ p: 2, gap: 2, bg: "background-secondary" }}>
                  <Text>Flex</Text>
                  <Text>row</Text>
                </Flex>
                <Grid columns={2} sx={{ gap: 2 }}>
                  <Text>Grid 1</Text>
                  <Text>Grid 2</Text>
                </Grid>
              </Section>
              <Section title="Text, Label, Link, Image, Icon">
                <Text variant="heading">Heading</Text>
                <Text variant="body">Body</Text>
                <Label>Label</Label>
                <Link href="https://notesnook.com">Link</Link>
                <Image src={IMAGE} alt="swatch" sx={{ width: 64, height: 32 }} />
                <Icon path={STAR_PATH} size="big" color="accent" />
              </Section>
              <Section title="Button">
                <Button onClick={() => showToast("success", "Pressed")}>
                  <Text>Default</Text>
                </Button>
                <Button variant="accent">
                  <Text>Accent</Text>
                </Button>
                <Button disabled>
                  <Text>Disabled</Text>
                </Button>
              </Section>
              <Section title="Input, Textarea">
                <Input
                  data-test-id="test-input"
                  placeholder="Input"
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                />
                <Textarea
                  data-test-id="test-textarea"
                  placeholder="Textarea"
                  rows={2}
                  selectTextOnFocus
                  defaultValue="Selected on focus"
                />
              </Section>
              <Section title="Checkbox, Radio, Switch">
                <Checkbox checked={checked} onChange={(event) => setChecked(event.target.checked)} />
                <Radio checked={radio} onChange={(event) => setRadio(event.target.checked)} />
                <Switch checked={on} onChange={(event) => setOn(event.target.checked)} />
              </Section>
              <Section title="Select, Slider, Progress">
                <Select
                  value={choice}
                  onChange={(event) => setChoice(event.target.value)}
                >
                  <option value="a">Option A</option>
                  <option value="b">Option B</option>
                </Select>
                <Slider
                  data-test-id="test-slider"
                  value={slider}
                  min={0}
                  max={100}
                  onChange={(event) => setSlider(event.target.valueAsNumber)}
                />
                <Progress value={slider} max={100} />
              </Section>
              <Section title="ColorPicker, QRCode">
                <ColorPicker value={color} onChange={setColor} />
                <QRCode value="https://notesnook.com" size={96} />
              </Section>
              <Section title="SplitPane, Pane">
                <SplitPane
                  direction="horizontal"
                  sx={{ width: 300, height: 60 }}
                >
                  <Pane id="left" initialSize={150}>
                    <Text>Left</Text>
                  </Pane>
                  <Pane id="right">
                    <Text>Right</Text>
                  </Pane>
                </SplitPane>
              </Section>
              <Section title="Virtuoso (5000 items)">
                <Virtuoso
                  data-test-id="test-virtual-list"
                  totalCount={ITEMS.length}
                  computeItemKey={(index: number) => ITEMS[index].id}
                  defaultItemHeight={28}
                  style={{ height: 140, width: 300 }}
                  itemContent={(index: number) => (
                    <Text sx={{ p: 1, height: 28 }}>Item {index}</Text>
                  )}
                />
              </Section>
              <Section title="SortableList">
                <SortableList
                  items={sortable}
                  onMove={(move) => {
                    const from = sortable.findIndex(
                      (item) => item.id === move.activeId
                    );
                    const next = [...sortable];
                    const [item] = next.splice(from, 1);
                    next.splice(move.index, 0, item);
                    setSortable(next);
                  }}
                  renderItem={(item, state) => (
                    <Text
                      sx={{
                        p: 1,
                        opacity: state.isDragging ? 0.5 : 1,
                        bg: state.isOver ? "background-secondary" : undefined
                      }}
                    >
                      {item.id}
                    </Text>
                  )}
                />
              </Section>
              <Section title="Dialog, Popover, Toast">
                <Button data-test-id="open-dialog" onClick={() => setDialog(true)}>
                  <Text>Dialog</Text>
                </Button>
                <Button
                  ref={anchor as never}
                  data-test-id="open-popover"
                  onClick={() => setPopover(true)}
                >
                  <Text>Popover</Text>
                </Button>
                <Button
                  data-test-id="open-toast"
                  onClick={() => showToast("info", "A toast")}
                >
                  <Text>Toast</Text>
                </Button>
              </Section>
            </ScrollContainer>
            <Modal isOpen={dialog} onRequestClose={() => setDialog(false)}>
              <Flex sx={{ flexDirection: "column", gap: 2, p: 3, bg: "background" }}>
                <Text variant="subtitle">Dialog</Text>
                <Text>Rendered with the theme</Text>
                <Button variant="accent" onClick={() => setDialog(false)}>
                  OK
                </Button>
              </Flex>
            </Modal>
            <Popover
              isOpen={popover}
              onClose={() => setPopover(false)}
              anchorRef={anchor}
              placement="bottom-start"
              sx={{ p: 2 }}
            >
              <Text>Popover content</Text>
            </Popover>
            <PopoverHost />
            <ToastHost />
          </Flex>
        </ThemeScope>
      </LayoutRoot>
    </WebThemeProvider>
  );
}
