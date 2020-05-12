import React, { useEffect } from "react";
import { Flex } from "rebass";
import { useStore } from "../../stores/theme-store";
import { changeSvgTheme } from "../../utils/css";

function Placeholder(props) {
  const accent = useStore((store) => store.accent);
  useEffect(() => {
    changeSvgTheme(accent);
  }, [accent]);
  const { image: Image } = props;

  return (
    <>
      <Flex
        variant="columnCenter"
        alignSelf="stretch"
        sx={{ position: "relative" }}
      >
        <Image width={"100%"} height={"200px"} />
      </Flex>
    </>
  );
}
export default Placeholder;
