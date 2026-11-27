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

import {
  Children,
  forwardRef,
  isValidElement,
  useRef,
  useState,
  type ReactNode
} from "react";
import type * as Contract from "../contracts/primitives";
import type { UIElement, UISelectElement } from "../contracts/elements";
import { useMenuStore } from "../shared/menu-store";
import { CaretDown } from "../shared/icons";
import {
  elementFor,
  type DesktopElement,
  type ElementControl
} from "./element";
import { Button, Flex, Text } from "./primitives";
import { changeEvent } from "./style/events";
import { testIdOf } from "./style/native-props";

function textOf(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) =>
      typeof child === "string" || typeof child === "number"
        ? String(child)
        : isValidElement<{ children?: ReactNode }>(child)
        ? textOf(child.props.children)
        : ""
    )
    .join("");
}

/** The options of a select: its `<option>` children, also inside `<optgroup>`. */
export function optionsOf(children: ReactNode): Contract.SelectOption[] {
  const options: Contract.SelectOption[] = [];
  for (const child of Children.toArray(children)) {
    if (
      !isValidElement<{
        value?: string | number;
        disabled?: boolean;
        label?: string;
        children?: ReactNode;
      }>(child)
    )
      continue;
    if (child.type === "option") {
      const title = child.props.label ?? textOf(child.props.children);
      options.push({
        value: child.props.value ?? title,
        title,
        disabled: child.props.disabled || undefined
      });
    } else options.push(...optionsOf(child.props.children));
  }
  return options;
}

export const Select = forwardRef<UISelectElement, Contract.SelectProps>(
  function Select(props, ref) {
    const { onValueChange, onChange } = props;
    const options = [...(props.options ?? []), ...optionsOf(props.children)];
    const [own, setOwn] = useState(props.defaultValue ?? options[0]?.value);
    const value = props.value ?? own;
    const trigger = useRef<DesktopElement | null>(null);
    const control = useRef<ElementControl>({}).current;
    control.value = value === undefined ? "" : String(value);
    const selected = options.find(
      (option) => String(option.value) === control.value
    );

    return (
      <Button
        ref={(node: UIElement | null) => {
          trigger.current = elementFor(node, control);
          const element = trigger.current as UISelectElement | null;
          if (typeof ref === "function") ref(element);
          else if (ref) ref.current = element;
        }}
        type="button"
        id={props.id}
        title={props.title}
        disabled={props.disabled}
        testID={testIdOf(props)}
        onPress={() => {
          trigger.current?.measureInWindow((x, y, width, height) => {
            useMenuStore.getState().open(
              options.map((option) => ({
                type: "button" as const,
                key: String(option.value),
                title: option.title,
                isDisabled: option.disabled,
                isChecked: String(option.value) === control.value,
                onClick: () => {
                  const next = String(option.value);
                  const changed = next !== control.value;
                  control.value = next;
                  if (props.value === undefined) setOwn(option.value);
                  onValueChange?.(next);
                  if (changed) onChange?.(changeEvent(trigger.current));
                }
              })),
              { x, y, width, height }
            );
          });
        }}
        sx={{
          flexDirection: "row",
          alignItems: "center",
          gap: "spacing3",
          bg: "background-secondary",
          border: "1px solid",
          borderColor: "border",
          borderRadius: "radius1",
          p: "5px",
          overflow: "hidden",
          ...props.sx
        }}
      >
        <Flex sx={{ flexDirection: "row", alignItems: "center" }}>
          <Text sx={{ color: "paragraph", fontSize: "xs" }}>
            {selected?.title ?? ""}
          </Text>
        </Flex>
        <CaretDown size={13} color="icon" />
      </Button>
    );
  }
);
