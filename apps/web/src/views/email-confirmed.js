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
        alignItems="center"
        overflowY="auto"
      >
        <Flex flex={1} justifyContent="center" alignItems="center">
          <Flex
            maxWidth={["95%", "400px", "400px"]}
            flexDirection="column"
            sx={{
              borderRadius: "default",
              border: "1px solid",
              borderTop: "none",
              borderColor: "primary",
            }}
          >
            <Text
              variant="heading"
              fontSize={32}
              bg="primary"
              textAlign="center"
              color="static"
              py={20}
              sx={{
                borderRadius: "default",
                borderBottomLeftRadius: "0px",
                borderBottomRightRadius: "0px",
              }}
            >
              <Text variant="title" color="static" textAlign="center">
                Notesnook
              </Text>
              Email confirmed
            </Text>
            <SaleBanner discount={50} coupon="WRLD2021" userId={userId} />
          </Flex>
        </Flex>
      </Flex>
    </ThemeProvider>
  );
}
export default EmailConfirmed;

function SaleBanner(props) {
  const { discount, coupon, userId } = props;

  return (
    <Flex flexDirection="column" p={4}>
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
      <Text variant="title" mt={2} textAlign="center">
        In celebration of this happy day, we are giving a special discount to
        all our new members.
      </Text>
      <Text
        variant="heading"
        fontSize={32}
        color="primary"
        textAlign="center"
        fontWeight="bold"
        mt={2}
      >
        {discount}% OFF if you subscribe today!
      </Text>
      <Button
        mt={2}
        fontSize="title"
        width="100%"
        fontWeight="bold"
        sx={{ boxShadow: "2px 2px 15px 0px #00000044" }}
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
      <Text variant="body" textAlign="center" mt={2} color="fontTertiary">
        Big companies say, "X feature won't be possible if we went
        zero-knowledge." We are here to call them out. Your contribution will
        help us prove that giving up on privacy is just an excuse to rip users
        off, sell their data and make money.
        <Text variant="body" fontSize="subBody" mt={1}>
          *Use code <b>{coupon}</b> at checkout to get your discount.
        </Text>
      </Text>
    </Flex>
  );
}
