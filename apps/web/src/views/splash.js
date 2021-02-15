import React, { useEffect, useState } from "react";
import { Flex } from "rebass";
import Animated from "../components/animated";
import Logo from "../assets/notesnook-logo.png";
import { db } from "../common";
import { EV, EVENTS } from "notes-core/common";
import { showToast } from "../utils/toast";
import { captureException } from "@sentry/react";

function Splash(props) {
  const [loading, setLoading] = useState(true);
  const [animationEnded, setAnimationEnded] = useState(false);
  useEffect(() => {
    (async function () {
      try {
        EV.subscribe(EVENTS.userLoggedOut, (reason) => {
          if (reason) {
            showToast("error", reason);
          }
        });
        await db.init();
      } catch (e) {
        captureException(e, (scope) => {
          scope.setExtra("where", "db.init");
          return scope;
        });
        console.error(e);
        showToast("error", `Error initializing database: ${e.message}`);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loading && animationEnded) props.onLoadingFinished();
  }, [loading, animationEnded, props]);

  return (
    <Flex
      flexDirection="column"
      bg="#f0f0f0"
      height="100%"
      justifyContent="center"
      alignItems="center"
      overflow="hidden"
    >
      <Animated.Image
        src={Logo}
        width={150}
        animate={{ scale: 1.05 }}
        transition={{
          repeat: 1,
          repeatType: "reverse",
          duration: 1,
        }}
        onAnimationComplete={() => setAnimationEnded(true)}
      />
    </Flex>
  );
}
export default Splash;
