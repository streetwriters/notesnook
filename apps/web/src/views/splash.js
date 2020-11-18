import React, { useEffect, useState } from "react";
import { Flex, Text } from "rebass";
import ThemeProvider from "../components/theme-provider";
import Animated from "../components/animated";
import { db } from "../common";
import { getRandom } from "../utils/random";
import * as Sentry from "@sentry/react";

const loadingLines = [
  "Ejecting bumfuzzled notes",
  "Clearing up taradiddle vaccuums",
  "Lollygagging all parachutes",
  "Absquatulating the note engines",
  "Personalizing nincompoop notebooks",
];

function Splash(props) {
  const [loading, setLoading] = useState(true);
  const [animationEnded, setAnimationEnded] = useState(false);
  useEffect(() => {
    (async function () {
      try {
        await db.init();
        setLoading(false);
      } catch (e) {
        Sentry.captureException(e, (scope) => {
          scope.setExtra("where", "db.init");
          return scope;
        });
        console.error(e);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loading && animationEnded) props.onLoadingFinished();
  }, [loading, animationEnded, props]);

  return (
    <ThemeProvider>
      <Flex
        flexDirection="column"
        bg="bgSecondary"
        height="100%"
        justifyContent="center"
        alignItems="center"
        overflow="hidden"
      >
        <Flex
          sx={{
            fontSize: 62,
            color: "primary",
            fontWeight: "bold",
            fontFamily: "body",
          }}
        >
          <Animated.Text backgroundColor="bgPrimary" overflow={"hidden"} x={0}>
            Notes
          </Animated.Text>
          <Animated.Flex backgroundColor="" overflow={"hidden"}>
            <Animated.Text
              initial={{ x: -100 * 1.2 }}
              animate={{ x: 0 }}
              transition={{ ease: "easeOut", duration: 1 }}
            >
              nook
            </Animated.Text>
          </Animated.Flex>
        </Flex>
        <Flex overflow="hidden" width={300}>
          <Animated.Box
            height={5}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1 }}
            bg="primary"
            sx={{ borderRadius: "default" }}
            onAnimationComplete={() => setAnimationEnded(true)}
          />
        </Flex>
        <Text color="text" mt={2}>
          {loadingLines[getRandom(0, loadingLines.length)]}
        </Text>
      </Flex>
    </ThemeProvider>
  );
}
export default Splash;
