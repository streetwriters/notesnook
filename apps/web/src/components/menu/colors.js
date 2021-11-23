import React from "react";
import { COLORS } from "../../common";
import * as Icon from "../icons/index";
import { useStore } from "../../stores/note-store";
import { Flex } from "rebass";
import useMobile from "../../utils/use-mobile";

function Colors(props) {
  const { id, color } = props.note;
  const setColor = useStore((store) => store.setColor);
  const isMobile = useMobile();

  return (
    <Flex flexWrap="wrap">
      {COLORS.map((label) => (
        <Flex
          sx={{ position: "relative" }}
          onClick={() => setColor(id, label)}
          key={label}
          justifyContent="center"
          alignItems="center"
        >
          <Icon.Circle
            size={isMobile ? 45 : 25}
            style={{ cursor: "pointer" }}
            color={label.toLowerCase()}
            strokeWidth={0}
            data-test-id={`menuitem-colors-${label}`}
          />
          {color === label.toLowerCase() && (
            <Icon.Checkmark
              data-test-id={`menuitem-colors-${label}-check`}
              sx={{
                position: "absolute",
                cursor: "pointer",
              }}
              color="static"
              size={isMobile ? 24 : 14}
            />
          )}
        </Flex>
      ))}
    </Flex>
  );
}
export default Colors;
