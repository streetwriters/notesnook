import { useMemo } from "react";
import { Flex, Text } from "rebass";
import * as Icon from "../icons";
import { ANALYTICS_EVENTS, trackEvent } from "../../utils/analytics";
import AnnouncementBody from "./body";

function Announcements({ announcements, removeAnnouncement }) {
  const announcement = useMemo(() => announcements[0], [announcements]);

  return (
    <Flex
      flexDirection="column"
      mx={1}
      mb={2}
      py={2}
      bg="bgSecondary"
      sx={{ borderRadius: "default", position: "relative" }}
    >
      <Text
        bg="errorBg"
        p="2px"
        sx={{
          position: "absolute",
          right: 2,
          top: 2,
          borderRadius: 50,
          cursor: "pointer",
          alignSelf: "end"
        }}
        title="Dismiss announcement"
        onClick={() => {
          trackEvent(
            ANALYTICS_EVENTS.announcementDismissed,
            announcement.title
          );
          removeAnnouncement && removeAnnouncement(announcement.id);
        }}
      >
        <Icon.Cross color="error" size={16} />
      </Text>
      <AnnouncementBody components={announcement.body} type="inline" />
    </Flex>
  );
}

export default Announcements;
