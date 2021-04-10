import React from "react";
import { Button, Flex, Text } from "rebass";
import * as Icon from "../icons";
import useAnnouncement from "../../utils/useAnnouncement";
import { hashNavigate } from "../../navigation";

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
          onClick={() => {
            switch (announcement.cta.type) {
              case "link":
                window.open(announcement.cta.action, "_blank");
                break;
              case "promo":
                hashNavigate(`/login?redirect=/buy/${announcement.cta.action}`);
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
