import { useMemo } from "react";
import { Flex, Text } from "rebass";
import * as Icon from "../icons";
import { ANALYTICS_EVENTS, trackEvent } from "../../utils/analytics";
import AnnouncementBody from "./body";

function Announcements({ announcements, removeAnnouncement }) {
  const announcement = useMemo(() => announcements[0], [announcements]);

  return (
    <Flex flexDirection="column" mt={0} sx={{ borderRadius: "default" }}>
      <Flex flex="1" justifyContent="space-between" alignItems="center" mx={2}>
        <Flex
          justifyContent="center"
          alignItems="center"
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
            borderRadius: "default",
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
      <AnnouncementBody components={announcement.body} type="inline" />
    </Flex>
  );
}

export default Announcements;
