import React, { useMemo } from "react";
import { Button, Flex, Text } from "rebass";
import * as Icon from "../icons";
import { showBuyDialog } from "../../common/dialog-controller";
import { trackEvent } from "../../utils/analytics";
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
            Announcement{" "}
            {announcements.length - 1 >= 1
              ? `(${announcements.length - 1} more)`
              : ""}
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

      {announcement.callToActions?.map((action) =>
        action.platforms.some(
          (platform) => allowedPlatforms.indexOf(platform) > -1
        ) ? (
          <Button
            m={0}
            mt={1}
            p={1}
            fontWeight="bold"
            onClick={async () => {
              trackEvent(action.data, action.type);
              switch (action.type) {
                case "link":
                  const url = new URL(action.data);
                  if (url.origin === window.location.origin)
                    window.open(action.data, "_self");
                  else window.open(action.data, "_blank");
                  break;
                case "promo":
                  const coupon = action.data;
                  await showBuyDialog(coupon);
                  break;
                default:
                  return;
              }
            }}
          >
            {action.title}
          </Button>
        ) : null
      )}
    </Flex>
  );
}

export default Announcements;
