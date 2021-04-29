import React, { useMemo } from "react";
import { Flex, Text } from "rebass";
import { getPlatform } from "../../utils/platform";

function Banner() {
  const link = useMemo(() => {
    const os = getPlatform();
    if (os === "Android")
      return "https://play.google.com/store/apps/details?id=com.streetwriters.notesnook";
    if (os === "iOS")
      return "https://apps.apple.com/pk/app/notesnook-take-private-notes/id1544027013";
    return null;
  }, []);
  if (link === null) return null;
  return (
    <Flex alignItems="center" justifyContent="center" bg="primary" py={1}>
      <Text color="static" textAlign="center" fontSize="title">
        Use our <a href={link}>mobile app</a> for a better experience.
      </Text>
    </Flex>
  );
}
export default Banner;
