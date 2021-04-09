import React, { useEffect } from "react";
import { Button, Flex, Text, Image } from "rebass";
import ThemeProvider from "../components/theme-provider";
import * as Icon from "../components/icons";
import { useQueryParams } from "../navigation";
import Logo from "../assets/logo.svg";
import { upgrade } from "../common/upgrade";
import { db } from "../common/db";
import { showLogInDialog } from "../common/dialog-controller";
import { showToast } from "../utils/toast";
import CountdownTimer from "@inlightmedia/react-countdown-timer";

function EmailConfirmed() {
  const [{ userId }] = useQueryParams();
  useEffect(() => {
    if (!userId) window.location.href = "/";
  }, [userId]);

  return (
    <ThemeProvider>
      <Flex
        flexDirection="column"
        bg="background"
        height="100%"
        justifyContent="center"
        alignItems="center"
      >
        <Image src={Logo} height={30} mt={2} />
        <Text variant="title" textAlign="center">
          Notesnook
        </Text>
        <Flex
          flex="1"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
        >
          <Text
            display="flex"
            variant="heading"
            fontSize={32}
            justifyContent="center"
            alignItems="center"
          >
            <Icon.Success color="primary" size={32} sx={{ mr: 2 }} /> Email
            confirmed!
          </Text>
          <Text variant="body" mt={2}>
            You can safely close this window and return to Notesnook.
          </Text>
          <SaleBanner
            discount={80}
            coupon="EARLYBIRD"
            offerEndDate="2021-04-11T00:00:00Z"
            userId={userId}
          />
        </Flex>
      </Flex>
    </ThemeProvider>
  );
}
export default EmailConfirmed;

function SaleBanner(props) {
  const { discount, coupon, offerEndDate, userId } = props;

  return (
    <Flex
      bg="shade"
      flexDirection="column"
      mt={5}
      justifyContent="center"
      alignItems="center"
      p={2}
      maxWidth={["80%", "auto", "auto"]}
      sx={{
        borderRadius: "default",
        border: "1px solid",
        borderColor: "primary",
      }}
    >
      <Text variant="title" textAlign="center">
        Notesnook Pro Early Bird Offer!
      </Text>
      <Text
        variant="heading"
        fontSize={32}
        color="primary"
        textAlign="center"
        fontWeight="bold"
      >
        {discount}% OFF
      </Text>
      <Text variant="body" fontSize="title" textAlign="center">
        *Use coupon{" "}
        <Text as="b" color="primary">
          {coupon}
        </Text>{" "}
        at checkout to get{" "}
        <Text as="b" color="primary">
          {discount}% off your first month.
        </Text>
      </Text>
      <CountdownTimer
        dateTime={offerEndDate}
        style={{
          color: "black",
          fontSize: 38,
          padding: 0,
          margin: 0,
          fontWeight: "bold",
        }}
        shouldHidePrecedingZeros={true}
        shouldShowTimeUnits
        shouldShowSeparator={false}
      />
      <Text variant="body" color="error" fontWeight="bold">
        Remaining to get {discount}% off your first month
      </Text>
      <Button
        mt={1}
        fontSize="title"
        width="100%"
        onClick={async () => {
          if (window.umami) {
            window.umami(`[Email verified] Subscribe button clicked`, "offers");
          }

          let user = await db.user.getUser();
          if (user && user.id === userId) {
            await upgrade(user, coupon);
            return;
          } else if (user && user.id !== userId) {
            const shouldLogout = window.confirm(
              "You are already logged into a different Notesnook account. Do you want to logout?"
            );
            if (!shouldLogout) return;
            await db.user.logout(true);
          }
          await showLogInDialog(
            `Login in to get ${discount}% off`,
            `Use the coupon "${coupon}" at checkout to get ${discount}% off your first month.`,
            `Get ${discount}% off`
          );

          user = await db.user.getUser();
          if (!user) {
            showToast("error", "You are not logged in. Please try again.");
            return;
          }
          await upgrade(user, coupon);
        }}
      >
        Subscribe now before offer ends!
      </Button>
      <Text variant="body" fontSize="subBody" mt={1}>
        *This offer only works if you purchase through our web app.
      </Text>
    </Flex>
  );
}
