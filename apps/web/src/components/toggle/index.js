import React from "react";
import { showBuyDialog } from "../../common/dialog-controller";
import Tip from "../tip";
import * as Icon from "../icons";
import { isUserPremium } from "../../hooks/use-is-user-premium";
import { Flex } from "rebass";

function Toggle(props) {
  const { title, onTip, offTip, isToggled, onToggled, onlyIf, premium } = props;

  if (onlyIf === false) return null;
  return (
    <Flex
      justifyContent="space-between"
      alignItems="center"
      onClick={async () => {
        if (isUserPremium() || !premium) onToggled();
        else {
          await showBuyDialog();
        }
      }}
      py={2}
      sx={{
        cursor: "pointer",
        borderBottom: "1px solid",
        borderBottomColor: "border",
        ":hover": { borderBottomColor: "primary" },
      }}
    >
      <Tip text={title} tip={isToggled ? onTip : offTip} />
      {isToggled ? (
        <Icon.ToggleChecked size={30} sx={{ flexShrink: 0 }} color="primary" />
      ) : (
        <Icon.ToggleUnchecked size={30} sx={{ flexShrink: 0 }} />
      )}
    </Flex>
  );
}
export default Toggle;
