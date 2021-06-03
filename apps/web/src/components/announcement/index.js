import React from "react";
import { Button, Flex, Text } from "rebass";
import * as Icon from "../icons";
import useAnnouncement from "../../utils/useAnnouncement";
import { db } from "../../common/db";
import { upgrade } from "../../common/checkout";
import { showLogInDialog } from "../../common/dialog-controller";
import { showToast } from "../../utils/toast";
import { trackEvent } from "../../utils/analytics";

function Announcement({ announcement, removeAnnouncement }) {
  return (
    <Flex
      // onClick={reminder?.action}
      flexDirection="column"
      p={2}
      pt={0}
    >
      <Flex flex="1" justifyContent="space-between" alignItems="center">
        <Flex
          justifyContent="center"
          alignItems="center"
          bg="shade"
          px={1}
          py={"1px"}
          sx={{ borderRadius: "default" }}
        >
          <Icon.Announcement size={12} color="primary" sx={{ mr: "3px" }} />
          <Text color="primary" variant="subBody" fontWeight="bold" mt={"2px"}>
            Announcement
          </Text>
        </Flex>
        <Text
          bg="errorBg"
          color="error"
          px={1}
          py={"1px"}
          variant="subBody"
          fontWeight="bold"
          sx={{ cursor: "pointer", ":hover": { opacity: 0.7 } }}
          onClick={() => {
            removeAnnouncement && removeAnnouncement();
          }}
        >
          Dismiss
        </Text>
      </Flex>
      <Text variant="heading" mt={1}>
        {announcement.title}
      </Text>

      {announcement && (
        <Text variant="body" lineHeight="18px">
          {announcement.description}
        </Text>
      )}

      {announcement.cta && (
        <Button
          m={0}
          mt={1}
          p={1}
          fontWeight="bold"
          onClick={async () => {
            trackEvent(announcement.cta.text, "Announcement CTA");
            switch (announcement.cta.type) {
              case "link":
                window.open(announcement.cta.action, "_blank");
                break;
              case "promo":
                const coupon = announcement.cta.action;
                let user = await db.user.getUser();
                if (user) {
                  await upgrade(user, coupon);
                  return;
                }
                await showLogInDialog(
                  `Login in to ${announcement.cta.text.toLowerCase()}`,
                  `Use the coupon "${coupon}" at checkout to ${announcement.cta.text.toLowerCase()} your first month.`,
                  announcement.cta.text,
                  true
                );

                user = await db.user.getUser();
                if (!user) {
                  showToast(
                    "error",
                    "You are not logged in. Please try again."
                  );
                  return;
                }
                await upgrade(user, coupon);
                break;
              default:
                return;
            }
          }}
        >
          {announcement.cta.text}
        </Button>
      )}
    </Flex>
  );
}

export default Announcement;
