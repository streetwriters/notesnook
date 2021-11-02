import React, { useCallback } from "react";
import { showBuyDialog } from "../../common/dialog-controller";
import Tip from "../tip";
import { isUserPremium } from "../../hooks/use-is-user-premium";
import { Flex } from "rebass";
import Switch from "../switch";

function Toggle(props) {
  const { title, onTip, offTip, isToggled, onToggled, onlyIf, premium } = props;
  const onClick = useCallback(async () => {
    if (isUserPremium() || !premium) onToggled();
    else {
      await showBuyDialog();
    }
  }, [onToggled, premium]);

  if (onlyIf === false) return null;
  return (
    <Flex
      justifyContent="space-between"
      alignItems="center"
      onClick={onClick}
      py={2}
      sx={{
        cursor: "pointer",
        borderBottom: "1px solid",
        borderBottomColor: "border",
        ":hover": { borderBottomColor: "primary" },
      }}
    >
      <Tip text={title} tip={isToggled ? onTip : offTip} sx={{ mr: 2 }} />
      <Switch onClick={onClick} checked={isToggled} />
    </Flex>
  );
}
export default Toggle;
