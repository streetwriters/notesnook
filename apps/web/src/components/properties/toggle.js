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

import { Flex, Text } from "@theme-ui/components";
import { useStore } from "../../stores/editor-store";
import Switch from "../switch";

function Toggle(props) {
  const { icon: ToggleIcon, label, onToggle, toggleKey } = props;
  const isOn = useStore((store) => store.session[toggleKey]);
  return (
    <Flex
      py={2}
      px={2}
      sx={{
        borderBottom: "1px solid var(--border)",
        cursor: "pointer",
        alignItems: "center",
        justifyContent: "space-between"
      }}
      onClick={() => onToggle(!isOn)}
      data-test-id={props.testId}
    >
      <Text
        variant="body"
        sx={{ alignItems: "center", color: "paragraph", display: "flex" }}
        data-test-id={`toggle-state-${isOn ? "on" : "off"}`}
      >
        <ToggleIcon size={13} sx={{ flexShrink: 0, mr: 1 }} />
        {label}
      </Text>
      <Switch onClick={() => onToggle(!isOn)} checked={isOn} />
    </Flex>
  );
}
export default Toggle;
