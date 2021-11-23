import { useMemo } from "react";
import { Flex, Text } from "rebass";
import * as Icon from "../icons";
import { ANALYTICS_EVENTS, trackEvent } from "../../utils/analytics";
import AnnouncementBody from "./body";

function Announcements({ announcements, removeAnnouncement }) {
  const announcement = useMemo(() => announcements[0], [announcements]);

  return (
    <Flex flexDirection="column" mt={0} sx={{ borderRadius: "default" }}>
      <Flex flex="1" justifyContent="end" alignItems="center" mx={2}>
        <Text
          bg="errorBg"
          color="error"
          //py={"1px"}
          p="2px"
          variant="subBody"
          fontWeight="bold"
          sx={{
            borderRadius: 50,
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
          <Icon.Cross color="error" size={16} />
        </Text>
      </Flex>
      <AnnouncementBody components={announcement.body} type="inline" />
    </Flex>
  );
}

export default Announcements;
