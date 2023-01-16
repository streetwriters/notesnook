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

import { useCallback } from "react";
import { showBuyDialog } from "../../common/dialog-controller";
import Tip from "../tip";
import { isUserPremium } from "../../hooks/use-is-user-premium";
import { Flex } from "@theme-ui/components";
import Switch from "../switch";

function Toggle(props) {
  const {
    title,
    onTip,
    offTip,
    isToggled,
    onToggled,
    onlyIf,
    premium,
    testId
  } = props;
  const onClick = useCallback(async () => {
    if (isUserPremium() || !premium || isToggled) onToggled();
    else {
      await showBuyDialog();
    }
  }, [onToggled, premium, isToggled]);

  if (onlyIf === false) return null;
  return (
    <Flex
      onClick={onClick}
      data-test-id={testId}
      py={2}
      sx={{
        cursor: "pointer",
        borderBottom: "1px solid",
        borderBottomColor: "border",
        ":hover": { borderBottomColor: "primary" },
        alignItems: "center",
        justifyContent: "space-between"
      }}
    >
      <Tip text={title} tip={isToggled ? onTip : offTip} sx={{ mr: 2 }} />
      <Switch onClick={onClick} checked={isToggled} />
    </Flex>
  );
}
export default Toggle;
