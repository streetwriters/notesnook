import React, { useEffect } from "react";
import { Button, Flex, Text, Image } from "rebass";
import ThemeProvider from "../components/theme-provider";
import * as Icon from "../components/icons";
import { useQueryParams } from "../navigation";
import Logo from "../assets/logo.svg";

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
          <SaleBanner discount={80} promoCode="EARLYBIRD" daysRemaining="2" />
        </Flex>
      </Flex>
    </ThemeProvider>
  );
}
export default EmailConfirmed;

function SaleBanner(props) {
  const { discount, promoCode, daysRemaining } = props;
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
        *Use code{" "}
        <Text as="b" color="primary">
          {promoCode}
        </Text>{" "}
        at checkout to get{" "}
        <Text as="b" color="primary">
          {discount}% off your first month.
        </Text>
      </Text>
      <Button
        mt={1}
        fontSize="title"
        width="100%"
        onClick={() => {
          if (window.umami)
            window.umami(`Email verified offer [${promoCode}] click`, "offers");
          window.location.href = `/#/login?redirect=/buy/${promoCode}`;
        }}
      >
        Subscribe now before offer ends!
      </Button>
      <Text as="em" variant="body" mt={1} color="error">
        (Only {daysRemaining} days remaining.)
      </Text>

      <Text variant="body" fontSize="subBody" mt={1}>
        *This offer only works if you purchase through our web app.
      </Text>
      {/* <Text variant="body" textAlign="center">
        Unlimited storage &amp; attachments
        <br />
        Unlimited notebooks &amp; tags
        <br />
        Automatic syncing &amp; backups
        <br />
        <a href="https://notesnook.com/">AND SO MUCH MORE!</a>
      </Text> */}
    </Flex>
  );
}
