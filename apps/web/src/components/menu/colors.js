import React from "react";
import { COLORS } from "../../common";
import * as Icon from "../icons/index";
import { objectMap } from "../../utils/object";
import { useStore } from "../../stores/note-store";
import { Flex } from "rebass";

function Colors(props) {
  const { id, colors } = props.data;
  const setColor = useStore((store) => store.setColor);

  return (
    <Flex flexWrap="wrap">
      {objectMap(COLORS, (label, code) => (
        <Flex
          sx={{ position: "relative" }}
          onClick={() => setColor(id, label)}
          key={label}
        >
          <Icon.Circle
            size={25}
            style={{ cursor: "pointer" }}
            color={code}
            strokeWidth={0}
          />
          {colors.includes(label) && (
            <Icon.Checkmark
              sx={{
                position: "absolute",
                left: "5px",
                cursor: "pointer",
              }}
              color="static"
              size={14}
            />
          )}
        </Flex>
      ))}
    </Flex>
  );
}
export default Colors;
