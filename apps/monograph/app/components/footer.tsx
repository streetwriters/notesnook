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

import { mdiMastodon, mdiReddit, mdiTwitter } from "@mdi/js";
import { Icon } from "@notesnook/ui";
import {
  Box,
  Flex,
  Text,
  Button,
  Link,
  ButtonProps,
  LinkProps
} from "@theme-ui/components";
import { ForwardRef } from "@theme-ui/components/dist/declarations/src/types";

const ButtonLink = Button as ForwardRef<
  HTMLButtonElement,
  ButtonProps & LinkProps
>;
const SOCIAL_LINKS = [
  { id: "X/Twitter", icon: mdiTwitter, href: "https://twitter.com/notesnook" },
  { id: "Reddit", icon: mdiReddit, href: "https://www.reddit.com/r/notesnook" },
  {
    id: "Telegram",
    icon: "M9.78 18.65l.28-4.23l7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3L3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z",
    href: "https://t.me/notesnook"
  },
  {
    id: "Discord",
    icon: "m22 24l-5.25-5l.63 2H4.5A2.5 2.5 0 0 1 2 18.5v-15A2.5 2.5 0 0 1 4.5 1h15A2.5 2.5 0 0 1 22 3.5V24M12 6.8c-2.68 0-4.56 1.15-4.56 1.15c1.03-.92 2.83-1.45 2.83-1.45l-.17-.17c-1.69.03-3.22 1.2-3.22 1.2c-1.72 3.59-1.61 6.69-1.61 6.69c1.4 1.81 3.48 1.68 3.48 1.68l.71-.9c-1.25-.27-2.04-1.38-2.04-1.38S9.3 14.9 12 14.9s4.58-1.28 4.58-1.28s-.79 1.11-2.04 1.38l.71.9s2.08.13 3.48-1.68c0 0 .11-3.1-1.61-6.69c0 0-1.53-1.17-3.22-1.2l-.17.17s1.8.53 2.83 1.45c0 0-1.88-1.15-4.56-1.15m-2.07 3.79c.65 0 1.18.57 1.17 1.27c0 .69-.52 1.27-1.17 1.27c-.64 0-1.16-.58-1.16-1.27c0-.7.51-1.27 1.16-1.27m4.17 0c.65 0 1.17.57 1.17 1.27c0 .69-.52 1.27-1.17 1.27c-.64 0-1.16-.58-1.16-1.27c0-.7.51-1.27 1.16-1.27Z",
    href: "https://discord.com/invite/zQBK97EE22"
  },
  {
    id: "Mastodon",
    icon: mdiMastodon,
    href: "https://fosstodon.org/@notesnook"
  }
];

const footerLinks = [
  {
    title: "Notesnook",
    type: "link",
    href: "https://notesnook.com"
  },
  {
    title: "Try for free",
    type: "link",
    href: "https://app.notesnook.com"
  },
  {
    title: "Blog",
    type: "link",
    href: "https://blog.notesnook.com/"
  },
  {
    title: "About",
    type: "link",
    href: "https://notesnook.com/about"
  }
];

export function Footer({ subtitle }: { subtitle?: string }) {
  return (
    <Flex
      as="footer"
      sx={{
        flexDirection: "column",
        paddingY: 50,
        backgroundColor: "background-secondary",
        width: "100%",
        borderTop: "1px solid var(--border)"
      }}
    >
      <Flex
        sx={{
          px: [10, "15%"],
          justifyContent: ["flex-start", "space-between"],
          flexWrap: "wrap",
          pb: 10,
          flexDirection: ["column", "row"]
        }}
      >
        <Box
          sx={{
            flexDirection: "column",
            justifyContent: "space-between"
          }}
        >
          <Flex
            sx={{
              flexDirection: "row",
              textDecorationLine: "none",
              alignItems: "center"
            }}
          >
            <Flex
              sx={{
                flexDirection: "column"
              }}
            >
              <Text
                sx={{
                  fontFamily: "monospace",
                  fontSize: 22
                }}
              >
                <span style={{ color: "var(--accent)" }}>Mono</span>graph
              </Text>
              <Text variant="subBody">
                {subtitle || "A product of Notesnook"}
              </Text>
            </Flex>
          </Flex>

          <Flex mt={2} sx={{ gap: 2 }}>
            {SOCIAL_LINKS.map((link) => (
              <ButtonLink
                key={link.id}
                as="a"
                sx={{ p: 0, m: 0 }}
                target={"_blank"}
                href={link.href}
              >
                <Icon path={link.icon} color="var(--icon)" size={25} />
              </ButtonLink>
            ))}
          </Flex>
        </Box>

        <Flex
          sx={{
            flexDirection: ["column", "row"]
          }}
        >
          {footerLinks.map((link) => (
            <ButtonLink
              key={link.title}
              as="a"
              href={link.href}
              variant="menuitem"
              sx={{
                textAlign: "left",
                borderRadius: "default"
              }}
              // sx={{
              //   height: 30,
              //   ":hover": {
              //     color: "accent",
              //     backgroundColor: "transparent"
              //   },
              //   ":active": {
              //     color: "accent",
              //     background: "background-secondary"
              //   },
              //   transition: "color 300ms ease-in",
              //   textAlign: "left",
              //   px: [0, "0.8em"]
              // }}
              title={link.title}
            >
              {link.title}
            </ButtonLink>
          ))}
        </Flex>
      </Flex>

      <Flex
        sx={{
          flexDirection: ["column-reverse", "row"],
          justifyContent: ["center", "space-between"],
          alignItems: "center",
          width: "100%",
          pt: 2,
          px: [10, "15%"],
          gap: 2
        }}
      >
        <Text variant="subBody" color="info">
          {new Date(Date.now()).getFullYear()} Streetwriters (Private) Ltd.
        </Text>
        <Flex sx={{ gap: 2 }}>
          <Link variant="text.subBody" href="https://notesnook.com/privacy">
            Privacy Policy
          </Link>
          <Link variant="text.subBody" href="https://notesnook.com/terms">
            Terms of Service
          </Link>
        </Flex>
      </Flex>
    </Flex>
  );
}
