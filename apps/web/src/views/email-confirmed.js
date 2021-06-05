import React, { useEffect } from "react";
import { Button, Flex, Text, Image } from "rebass";
import ThemeProvider from "../components/theme-provider";
import * as Icon from "../components/icons";
import { useQueryParams } from "../navigation";
import Logo from "../assets/logo.svg";
import { upgrade } from "../common/checkout";
import { db } from "../common/db";
import { showLogInDialog } from "../common/dialog-controller";
import { showToast } from "../utils/toast";
// import CountdownTimer from "@inlightmedia/react-countdown-timer";
import { trackEvent } from "../utils/analytics";

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
            discount={50}
            coupon="WRLD2021"
            offerEndDate="2021-06-06T00:00:00Z"
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
      flexDirection="column"
      mt={5}
      justifyContent="center"
      alignItems="center"
      p={2}
      maxWidth={["95%", "60%", "50%"]}
      sx={{
        borderRadius: "default",
        border: "1px solid",
        borderColor: "primary",
      }}
    >
      <Text variant="heading" textAlign="center">
        We proved them wrong!
      </Text>
      <Text
        as="p"
        variant="body"
        fontSize="title"
        lineHeight="22px"
        textAlign="center"
      >
        We started out building Notesnook in November 2019. Our mission was to
        make privacy simple. It is one thing to say,{" "}
        <Text as="span" color="primary">
          "Privacy is our basic right"
        </Text>{" "}
        and quite another to actually prove it.
        <br />
        Almost 1 and a half year later, we are here with over 2000 users, 5000+
        downloads on Google Play Store, 10,000+ encrypted notes, and 100+
        members in our Discord community; all proof that{" "}
        <Text as="span" color="primary">
          privacy matters.
        </Text>
        <br />
      </Text>
      <Text variant="title" mt={2}>
        In celebration of this happy day, we are giving a special discount to
        all our new members.
      </Text>
      <Text
        variant="heading"
        fontSize={32}
        color="primary"
        textAlign="center"
        fontWeight="bold"
      >
        {discount}% OFF if you subscribe today!
      </Text>
      <Text variant="body" textAlign="center" mt={1}>
        Big companies say, "This X &amp; Y feature won't be possible if we went
        zero-knowledge." We are here to call them out. Your contribution will
        help us prove that giving up on privacy is just an excuse to rip users
        off, sell their data and make money.
      </Text>
      {/* <Text variant="body" fontSize="title" textAlign="center">
        *Use coupon{" "}
        <Text as="b" color="primary">
          {coupon}
        </Text>{" "}
        at checkout to get{" "}
        <Text as="b" color="primary">
          {discount}% off your first month.
        </Text>
      </Text> */}
      {/* <CountdownTimer
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
      </Text> */}
      <Button
        mt={2}
        fontSize="title"
        width="100%"
        fontWeight="bold"
        onClick={async () => {
          trackEvent(`Email verification offer`, "offers");

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
            `Get ${discount}% off`,
            true
          );

          user = await db.user.getUser();
          if (!user) {
            showToast("error", "You are not logged in. Please try again.");
            return;
          }
          await upgrade(user, coupon);
        }}
      >
        Subscribe now to stand up for privacy!
      </Button>
      <Text variant="body" fontSize="subBody" mt={1}>
        *Use code <b>{coupon}</b> at checkout to get your discount.
      </Text>
    </Flex>
  );
}
