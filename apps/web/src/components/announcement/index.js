import React from "react";
import { Button, Flex, Text } from "rebass";
import * as Icon from "../icons";
import useAnnouncement from "../../utils/useAnnouncement";
import { db } from "../../common/db";
import { upgrade } from "../../common/checkout";
import { showLogInDialog } from "../../common/dialog-controller";
import { showToast } from "../../utils/toast";
import { trackEvent } from "../../utils/analytics";

function Announcement() {
  const [announcement, removeAnnouncement] = useAnnouncement();
  if (!announcement) return null;
  return (
    <Flex
      bg={"shade"}
      // onClick={reminder?.action}
      flexDirection="column"
      p={2}
    >
      <Flex flex="1" justifyContent="space-between" alignItems="center">
        <Text variant="title">{announcement.title}</Text>
        <Icon.Close
          size={20}
          color="primary"
          onClick={() => removeAnnouncement()}
          sx={{ cursor: "pointer" }}
        />
      </Flex>

      {announcement && <Text variant="body">{announcement.description}</Text>}

      {announcement.cta && (
        <Button
          m={0}
          mt={1}
          p={1}
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
