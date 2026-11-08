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

import { useEffect } from "react";
import { strings } from "@notesnook/intl";
import { shell } from "@platform";
import { dataColor, Flex, ScrollContainer, Text } from "@ui";
import { hardNavigate, useQueryParams } from "../navigation";
import {
  Chat as Discord,
  MailCheck,
  Reddit,
  Twitter
} from "../components/icons";

function EmailConfirmed() {
  const [{ userId }] = useQueryParams();
  useEffect(() => {
    if (!userId) hardNavigate("/");
  }, [userId]);

  return (
    <Flex sx={{ bg: "background", flexDirection: "column", flex: 1 }}>
      <ScrollContainer>
        <Flex
          sx={{
            flex: 1,
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 400
          }}
        >
          <MailCheck
            sx={{ bg: "shade", borderRadius: 100, p: 5 }}
            size={72}
            color="accent"
          />
          <Text
            variant="heading"
            sx={{
              mt: 5,
              fontSize: 45,
              textAlign: "center",
              fontWeight: "heading"
            }}
          >
            {strings.huzzah()}
          </Text>
          <Text
            variant="heading"
            sx={{
              mt: 2,
              fontSize: 27,
              textAlign: "center",
              fontWeight: "bold",
              color: "icon"
            }}
          >
            {strings.emailConfirmed()}
          </Text>
          <Text
            variant="body"
            sx={{
              mt: 2,
              fontSize: 21.6,
              textAlign: "center",
              color: "paragraph-secondary"
            }}
          >
            {strings.confirmEmailThankyou()}
          </Text>
        </Flex>
        <Flex
          sx={{
            bg: "background-secondary",
            p: 5,
            flexDirection: "column",
            justifyContent: "center"
          }}
        >
          <BlogPromoBanner />
        </Flex>
      </ScrollContainer>
    </Flex>
  );
}
export default EmailConfirmed;

const social = [
  {
    title: "Discord",
    hoverColor: "#7289da",
    icon: Discord,
    link: "https://discord.com/invite/zQBK97EE22"
  },
  {
    title: "Twitter",
    hoverColor: "#1da1f2",
    icon: Twitter,
    link: "https://twitter.com/notesnook"
  },
  {
    title: "Reddit",
    hoverColor: "#ff4500",
    icon: Reddit,
    link: "https://reddit.com/r/Notesnook"
  }
];

function BlogPromoBanner() {
  return (
    <Flex
      sx={{
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <Text variant="heading" sx={{ fontSize: 21.6, textAlign: "center" }}>
        {strings.shareWithFriends()}
      </Text>
      <Text
        variant="body"
        sx={{ mt: 2, fontSize: 18, textAlign: "center", color: "paragraph" }}
      >
        {strings.shareWithFriendsDesc()}
      </Text>
      <Flex sx={{ flexDirection: "row", mt: 5 }}>
        {social.map((account) => (
          <account.icon
            key={account.title}
            title={account.title}
            onPress={() => shell.openUrl(account.link)}
            size={30}
            color="icon"
            sx={{
              mr: 1,
              cursor: "pointer",
              ":hover": { color: dataColor(account.hoverColor) }
            }}
          />
        ))}
      </Flex>
      <Text
        variant="body"
        sx={{ mt: 2, textAlign: "center", color: "paragraph" }}
      >
        {strings.tagPromoWinText()[0]}{" "}
        <Text sx={{ fontWeight: "bold", color: "accent" }}>
          {strings.tagPromoWinText()[1]}
        </Text>{" "}
        {strings.tagPromoWinText()[2]}
      </Text>
    </Flex>
  );
}
