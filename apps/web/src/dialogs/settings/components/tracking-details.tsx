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
import { ANALYTICS_EVENTS } from "../../../utils/analytics";

const events = Object.values(ANALYTICS_EVENTS);
export function TrackingDetails() {
  return (
    <table
      style={{ tableLayout: "fixed", borderCollapse: "collapse" }}
      cellPadding={0}
      cellSpacing={0}
    >
      <thead>
        <Box
          as="tr"
          sx={{
            height: 30,
            th: { borderBottom: "1px solid var(--border)" }
          }}
        >
          {[
            { id: "event-name", title: "Event name", width: "15%" },
            { id: "event-detail", title: "Detail", width: "50%" }
          ].map((column) =>
            !column.title ? (
              <th key={column.id} />
            ) : (
              <Box
                as="th"
                key={column.id}
                sx={{
                  width: column.width,
                  px: 1,
                  mb: 2,
                  textAlign: "left"
                }}
              >
                <Text
                  variant="body"
                  sx={{ textAlign: "left", fontWeight: "normal" }}
                >
                  {column.title}
                </Text>
              </Box>
            )
          )}
        </Box>
      </thead>
      <tbody>
        {events.map((event) => (
          <tr key={event.name} style={{ height: 30 }}>
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
      </tbody>
    </table>
  );
}
