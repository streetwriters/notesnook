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

import { Flex, Text, Switch } from "@theme-ui/components";
import { Icon } from "../icons";

type ToggleProps = {
  icon: Icon;
  label: string;
  onToggle: (toggleState: boolean) => void;
  isOn: boolean;
  testId?: string;
};
function Toggle(props: ToggleProps) {
  const { icon: ToggleIcon, label, onToggle, isOn } = props;

  return (
    <Flex
      sx={{
        cursor: "pointer",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "spacing4",
        borderRadius: "radius2",
        "& label": { width: "auto", flexShrink: 0 }
      }}
      data-test-id={props.testId}
      onClick={() => onToggle(!isOn)}
    >
      <Flex
        sx={{
          alignItems: "center",
          display: "flex",
          minWidth: 0,
          gap: "spacing4"
        }}
        data-test-id={`toggle-state-${isOn ? "on" : "off"}`}
      >
        <Flex
          sx={{
            alignItems: "center",
            justifyContent: "center",
            width: 24,
            height: 24,
            flexShrink: 0,
            borderRadius: "radius1",
            bg: "background-tertiary"
          }}
        >
          <ToggleIcon size={15} />
        </Flex>
        <Text
          sx={{
            color: "heading",
            fontSize: "xs",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }}
        >
          {label}
        </Text>
      </Flex>
      <Switch
        sx={{
          m: 0,
          bg: isOn ? "accent" : "border",
          flexShrink: 0
        }}
        checked={isOn}
        onClick={(e) => e.stopPropagation()}
      />
    </Flex>
  );
}
export default Toggle;
