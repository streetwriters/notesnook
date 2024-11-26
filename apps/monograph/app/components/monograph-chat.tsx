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

import { mdiTimerOutline } from "@mdi/js";
import { Icon } from "@notesnook/ui";
import { Flex, Image, Link, Text } from "@theme-ui/components";
import { SxProp } from "@theme-ui/core";

type Props = SxProp & { publicUrl: string };

export function MonographChat({ sx, publicUrl }: Props) {
  return (
    <Flex
      sx={{
        border: "1px solid var(--border)",
        backgroundColor: "background-secondary",
        borderRadius: "20px",
        flexDirection: "column",
        p: "15px",
        ...sx
      }}
    >
      <ChatItem
        message="Hey, have you prepared the documents I asked you for?"
        time="20m ago"
        incoming={true}
      />

      <Flex
        sx={{
          width: "100%",
          mb: "15px",
          justifyContent: "flex-end"
        }}
      >
        <Flex
          sx={{
            backgroundColor: "shade",
            borderRadius: 10,
            position: "relative",
            flexDirection: "column",
            maxWidth: "70%"
          }}
        >
          <Image
            sx={{
              borderRadius: 10,
              width: "100%"
            }}
            src={`${publicUrl}/api/og.jpg?title=Open+sourcing&description=VGhpcyBtb25vZ3JhcGggaXMgZW5jcnlwdGVkLiBFbnRlciBwYXNzd29yZCB0byB2aWV3IGNvbnRlbnRzLg%3D%3D&date=Saturday%2C+February+18%2C+2023`}
          />
          <Text
            mt="12px"
            px="12px"
            sx={{ fontSize: "13px", color: "paragraph" }}
          >
            Yes, here&apos;s the link:{" "}
            <Link
              sx={{
                fontSize: "13px",
                color: "accent",
                overflowWrap: "anywhere"
              }}
              href={`${publicUrl}/62db75572020209c36f9f9fb`}
              target="_blank"
            >
              {publicUrl}/62db75572020209c36f9f9fb
            </Link>
          </Text>
          <Timer time={"5m ago"} sx={{ mb: 1, mr: 1, alignSelf: "end" }} />
        </Flex>
      </Flex>

      <ChatItem
        message="Awesome thanks! What's the password?"
        time="1m ago"
        incoming={true}
      />

      <ChatItem
        message={
          <>
            The password is{" "}
            <Text
              as="span"
              sx={{
                filter: "blur(3px)",
                fontSize: "13px",
                transition: "filter 300ms ease-out",
                cursor: "pointer",
                ":hover": {
                  filter: "none"
                }
              }}
            >
              open-source
            </Text>
          </>
        }
        time="just now"
        incoming={false}
      />
    </Flex>
  );
}

const ChatItem = ({
  message,
  time,
  incoming
}: {
  message: JSX.Element | string;
  time: string;
  incoming: boolean;
}) => {
  return (
    <Flex
      sx={{
        width: "100%",
        mb: "15px",
        justifyContent: !incoming ? "flex-end" : "flex-start"
      }}
    >
      <Flex
        sx={{
          backgroundColor: incoming ? "background-secondary" : "shade",
          borderRadius: 10,
          p: 2,
          pb: 1,
          flexDirection: "column",
          maxWidth: "70%"
        }}
      >
        <Text sx={{ fontSize: "13px", color: "paragraph" }}>{message}</Text>
        <Timer time={time} />
      </Flex>
    </Flex>
  );
};

function Timer({ time, sx }: { time: string } & SxProp) {
  return (
    <Flex sx={{ gap: "3px", ...sx }}>
      <Icon path={mdiTimerOutline} size={12} color="var(--paragraph)" />
      <Text
        sx={{
          p: 0,
          height: "auto",
          flexShrink: 0,
          alignSelf: "end",
          fontSize: "10px",
          color: "paragraph"
        }}
      >
        {time}
      </Text>
    </Flex>
  );
}
