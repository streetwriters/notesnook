import React from "react";
import { showBuyDialog } from "../../common/dialog-controller";
import Tip from "../tip";
import { isUserPremium } from "../../hooks/use-is-user-premium";
import { Flex } from "rebass";
import ReactToggle from "react-toggle";
import "react-toggle/style.css";
import "../properties/toggle.css";

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
      <ReactToggle
        size={20}
        onChange={() => {}}
        checked={isToggled}
        icons={false}
      />
    </Flex>
  );
}
export default Toggle;
