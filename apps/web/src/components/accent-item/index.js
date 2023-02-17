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

import { Flex } from "@theme-ui/components";
import * as Icon from "../icons";
import { useStore as useThemeStore } from "../../stores/theme-store";
import { showBuyDialog } from "../../common/dialog-controller";
import { isUserPremium } from "../../hooks/use-is-user-premium";

function AccentItem(props) {
  const { code, label } = props;
  const setAccent = useThemeStore((store) => store.setAccent);
  const accent = useThemeStore((store) => store.accent);

  return (
    <Flex
      variant="rowCenter"
      sx={{ position: "relative" }}
      onClick={async () => {
        if (isUserPremium()) setAccent(code);
        else {
          await showBuyDialog();
        }
      }}
      key={label}
    >
      {code === accent && (
        <Icon.Checkmark
          sx={{
            position: "absolute",
            zIndex: 1,
            cursor: "pointer"
          }}
          color="white"
          size={20}
        />
      )}
      <Icon.Circle size={40} sx={{ cursor: "pointer" }} color={code} />
    </Flex>
  );
}
export default AccentItem;
