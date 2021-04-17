import React, { useMemo } from "react";
import { Flex, Text } from "rebass";

function Banner() {
  const link = useMemo(() => {
    const os = getOS();
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

function getOS() {
  var userAgent = window.navigator.userAgent,
    platform = window.navigator.platform,
    macosPlatforms = ["Macintosh", "MacIntel", "MacPPC", "Mac68K"],
    windowsPlatforms = ["Win32", "Win64", "Windows", "WinCE"],
    iosPlatforms = ["iPhone", "iPad", "iPod"],
    os = null;

  if (macosPlatforms.indexOf(platform) !== -1) {
    os = "Mac OS";
  } else if (iosPlatforms.indexOf(platform) !== -1) {
    os = "iOS";
  } else if (windowsPlatforms.indexOf(platform) !== -1) {
    os = "Windows";
  } else if (/Android/.test(userAgent)) {
    os = "Android";
  } else if (!os && /Linux/.test(platform)) {
    os = "Linux";
  }

  return os;
}
