import React from "react";
import { Box, Text } from "rebass";
import { ANALYTICS_EVENTS } from "../../utils/analytics";
import Dialog from "./dialog";

const events = Object.values(ANALYTICS_EVENTS);
function TrackingDetailsDialog(props) {
  return (
    <Dialog
      isOpen={true}
      title={"Telemetry details"}
      description={
        "List of all the events we send to our servers for diagnostics and analytics. The data is transmitted over SSL (fully encrypted) and does not pass through any 3rd party server. Furthermore, the data does not contain any personal info - not even your user id."
      }
      onClose={props.onClose}
      positiveButton={{
        text: "Okay",
        onClick: props.onClose,
      }}
    >
      <Box overflowY="auto">
        <table>
          <tr>
            <Text as="th" textAlign="left" variant="title">
              Event name
            </Text>{" "}
            <Text as="th" textAlign="left" variant="title">
              Event detail
            </Text>
          </tr>
          {events.map((event) => (
            <tr>
              <Text
                as="td"
                sx={{ wordWrap: "break-word", maxWidth: 130 }}
                variant="body"
              >
                {event.name}
              </Text>
              <Text as="td" variant="body">
                {event.description}
              </Text>
            </tr>
          ))}
        </table>
      </Box>
    </Dialog>
  );
}

export default TrackingDetailsDialog;
