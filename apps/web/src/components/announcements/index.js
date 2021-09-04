import React, { useMemo } from "react";
import { Button, Flex, Text } from "rebass";
import * as Icon from "../icons";
import { showBuyDialog } from "../../common/dialog-controller";
import { ANALYTICS_EVENTS, trackEvent } from "../../utils/analytics";
import { allowedPlatforms } from "../../utils/use-announcements";

function Announcements({ announcements, removeAnnouncement }) {
  const announcement = useMemo(() => announcements[0], [announcements]);

  return (
    <Flex flexDirection="column" p={2} pt={0}>
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
          <Text color="primary" variant="subBody" fontWeight="bold">
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
          sx={{
            cursor: "pointer",
            ":hover": { opacity: 0.7 },
          }}
          onClick={() => {
            trackEvent(
              ANALYTICS_EVENTS.announcementDismissed,
              announcement.title
            );
            removeAnnouncement && removeAnnouncement(announcement.id);
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
      <Flex justifyContent="space-evenly" mt={1}>
        {announcement.callToActions
          ?.filter((cta) =>
            cta.platforms.some(
              (platform) => allowedPlatforms.indexOf(platform) > -1
            )
          )
          .map((action, index) => (
            <Button
              flex={1}
              m={0}
              p={1}
              as={action.type === "link" ? "a" : "button"}
              href={action.type === "link" ? action.data : ""}
              variant={
                index === 0
                  ? "primary"
                  : index === 1
                  ? "secondary"
                  : index === 2
                  ? "tertiary"
                  : "shade"
              }
              sx={{
                ":first-of-type": {
                  mr: 1,
                },
              }}
              fontWeight="bold"
              onClick={async () => {
                trackEvent(ANALYTICS_EVENTS.announcementCta, action.data);
                switch (action.type) {
                  case "link":
                    const url = new URL(action.data);
                    if (url.origin === window.location.origin)
                      window.open(action.data, "_self");
                    else window.open(action.data, "_blank");
                    break;
                  case "promo":
                    const [coupon, plan] = action.data.split(":");
                    await showBuyDialog(plan, coupon);
                    break;
                  default:
                    return;
                }
              }}
            >
              {action.title}
            </Button>
          ))}
      </Flex>
    </Flex>
  );
}

export default Announcements;
