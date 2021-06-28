import React, { useEffect } from "react";
import { Button, Flex, Text } from "rebass";
import ThemeProvider from "../components/theme-provider";
import { db } from "../common/db";
import { showBuyDialog } from "../common/dialog-controller";
import { trackEvent } from "../utils/analytics";
import { useQueryParams } from "../navigation";

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
            <BlogPromoBanner link="" />
          </Flex>
        </Flex>
      </Flex>
    </ThemeProvider>
  );
}
export default EmailConfirmed;

function BlogPromoBanner(props) {
  const { link } = props;
  return (
    <Flex flexDirection="column" p={4}>
      <Text variant="heading" textAlign="center">
        Do you know why we made notesnook?
      </Text>
      <Text variant="body" fontSize="title" mt={1}>
        There are so many note taking apps out there. But none of them fix the
        core issue with privacy.
      </Text>

      <Text variant="body" fontSize="title" mt={1}>
        Privacy has become undesirable because you have to sacrifice so much.
      </Text>

      <Text variant="body" fontSize="title" mt={1}>
        In your heart, you know privacy is important. But you can't give up on
        that awesome feature.
      </Text>

      <Text variant="body" fontSize="title" mt={1}>
        You are forced to keep using privacy invasive apps because...the
        alternative is not as productive.
      </Text>

      <Text variant="title" mt={1}>
        But we are going to change that.
      </Text>
      <Button
        mt={2}
        as="a"
        href={link}
        target="_blank"
        fontSize="title"
        width="100%"
        fontWeight="bold"
        sx={{ boxShadow: "2px 2px 15px 0px #00000044" }}
        onClick={() =>
          trackEvent(`Email verification blog promo`, "blog-promo")
        }
      >
        How are we going to do that? Read on.
      </Button>
    </Flex>
  );
}

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
          if (user && user.id !== userId) await db.user.logout(true);
          await showBuyDialog(coupon);
        }}
      >
        Subscribe now and stand up for privacy!
      </Button>
      <Text variant="body" textAlign="center" mt={2} color="fontTertiary">
        Big companies say, "X feature won't be possible if we went
        zero-knowledge." We are here to call them out. Your contribution will
        help us prove that giving up on privacy is just an excuse to rip users
        off, sell their data and make money.
        <Text variant="body" fontSize="subBody" mt={1}>
          *Use code <b>{coupon}</b> at checkout to get your discount.
        </Text>
        <Text variant="body" fontSize="subBody" mt={1}>
          ** Only the first 10 people get to claim the discount. Be the first.
        </Text>
      </Text>
    </Flex>
  );
}
