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

import { Flex, Switch, Text } from "@ui";
import type { Icon } from "../icons";

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
      testID={props.testId}
      onPress={() => onToggle(!isOn)}
      sx={{
        flexDirection: "row",
        cursor: "pointer",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "spacing4",
        borderRadius: "radius2"
      }}
    >
      <Flex
        testID={`toggle-state-${isOn ? "on" : "off"}`}
        sx={{
          flexDirection: "row",
          alignItems: "center",
          minWidth: 0,
          gap: "spacing4"
        }}
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
          <ToggleIcon size={15} color="icon" />
        </Flex>
        <Text numberOfLines={1} sx={{ color: "heading", fontSize: "xs" }}>
          {label}
        </Text>
      </Flex>
      <Switch
        checked={isOn}
        onChange={onToggle}
        sx={{ m: 0, bg: isOn ? "accent" : "icon-disabled", flexShrink: 0 }}
      />
    </Flex>
  );
}
export default Toggle;
