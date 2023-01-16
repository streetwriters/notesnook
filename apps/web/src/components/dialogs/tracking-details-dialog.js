/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { Box, Text } from "@theme-ui/components";
import { ANALYTICS_EVENTS } from "../../utils/analytics";
import Dialog from "./dialog";

const events = Object.values(ANALYTICS_EVENTS);
function TrackingDetailsDialog(props) {
  return (
    <Dialog
      isOpen={true}
      title={"Telemetry details"}
      width={"30%"}
      description={
        "List of all the events we send to our servers for diagnostics and analytics. The data is transmitted over SSL (fully encrypted) and does not pass through any 3rd party server. Furthermore, the data does not contain any personal info - not even your user id."
      }
      onClose={props.onClose}
      positiveButton={{
        text: "Okay",
        onClick: props.onClose
      }}
    >
      <Box sx={{ overflowY: "auto" }}>
        <table>
          <tr>
            <Text as="th" variant="subtitle" sx={{ textAlign: "left" }}>
              Event name
            </Text>{" "}
            <Text as="th" variant="subtitle" sx={{ textAlign: "left" }}>
              Event detail
            </Text>
          </tr>
          {events.map((event) => (
            <tr key={event.name}>
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
