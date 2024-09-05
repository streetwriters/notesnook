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

import { useCallback, useState } from "react";
import Tip from "../tip";
import { isUserPremium } from "../../hooks/use-is-user-premium";
import { Flex, Switch } from "@theme-ui/components";
import { Loading } from "../icons";
import { BuyDialog } from "../../dialogs/buy-dialog/buy-dialog";

function Toggle(props) {
  const {
    title,
    onTip,
    offTip,
    isToggled,
    onToggled,
    onlyIf,
    premium,
    testId,
    disabled,
    tip
  } = props;
  const [isLoading, setIsLoading] = useState(false);
  const onClick = useCallback(async () => {
    if (isUserPremium() || !premium || isToggled) {
      setIsLoading(true);
      try {
        await onToggled();
      } finally {
        setIsLoading(false);
      }
    } else {
      await BuyDialog.show({});
    }
  }, [onToggled, premium, isToggled]);

  if (onlyIf === false) return null;
  return (
    <Flex
      onClick={disabled ? null : onClick}
      data-test-id={testId}
      py={2}
      sx={{
        opacity: disabled ? 0.7 : 1,
        cursor: "pointer",
        borderBottom: "1px solid",
        borderBottomColor: "separator",
        ":hover": { borderBottomColor: "accent" },
        alignItems: "center",
        justifyContent: "space-between",

        "& > label": { width: "auto", flexShrink: 0 }
      }}
    >
      <Tip
        text={title}
        tip={tip ? tip : isToggled ? onTip : offTip}
        sx={{ mr: 2 }}
      />
      {isLoading ? (
        <Loading size={18} />
      ) : (
        <Switch
          onClick={disabled ? null : onClick}
          checked={isToggled}
          sx={{ m: 0, bg: isToggled ? "accent" : "icon" }}
        />
      )}
    </Flex>
  );
}
export default Toggle;
