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

import { SettingsGroup } from "./types";
import { appVersion } from "../../../utils/version";
import { writeText } from "clipboard-polyfill";
import { showToast } from "../../../utils/toast";
import { checkForUpdate } from "../../../utils/updater";
import { isMacStoreApp } from "../../../utils/platform";
import { showIssueDialog } from "../../../common/dialog-controller";
import { clearLogs, downloadLogs } from "../../../utils/logger";

export const AboutSettings: SettingsGroup[] = [
  {
    key: "about",
    section: "about",
    header: "About",
    settings: [
      {
        key: "version",
        title: "Version",
        description: appVersion.formatted,
        components: [
          {
            type: "button",
            action: checkForUpdate,
            title: "Check for updates",
            variant: "secondary"
          },
          {
            type: "button",
            action: async () => {
              await writeText(appVersion.formatted);
              showToast("info", "Copied to clipboard!");
            },
            title: "Copy",
            variant: "secondary"
          }
        ]
      },
      {
        key: "roadmap",
        title: "Roadmap",
        description:
          "See what we have planned for Notesnook in the coming months.",
        components: [
          {
            type: "button",
            action: () =>
              void window.open("https://notesnook.com/roadmap", "_blank"),
            title: "Check roadmap",
            variant: "secondary"
          }
        ]
      },
      {
        key: "available-on-mobile",
        title: isMacStoreApp()
          ? "Available on iOS"
          : "Available on iOS & Android",
        description: isMacStoreApp()
          ? "Get Notesnook app on your iPhone and access all your notes on the go."
          : "Get Notesnook app on your iPhone or Android device and access all your notes on the go.",
        components: [
          {
            type: "button",
            action: () =>
              void window.open(
                isMacStoreApp()
                  ? "https://apps.apple.com/us/app/notesnook-take-private-notes/id1544027013"
                  : "https://notesnook.com/downloads",
                "_blank"
              ),
            title: "Download",
            variant: "secondary"
          }
        ]
      }
    ]
  },
  {
    key: "community",
    section: "about",
    header: "Community",
    settings: [
      {
        key: "telegram",
        title: "Join our Telegram group",
        description: "We are on Telegram. Let's have a chat!",
        components: [
          {
            type: "button",
            action: () => void window.open("https://t.me/notesnook", "_blank"),
            title: "Join Telegram",
            variant: "secondary"
          }
        ]
      },
      {
        key: "mastodon",
        title: "Follow us on Mastodon",
        description: "We are on Mastodon!",
        components: [
          {
            type: "button",
            action: () => void window.open("https://t.me/notesnook", "_blank"),
            title: "Follow",
            variant: "secondary"
          }
        ]
      },
      {
        key: "twitter",
        title: "Follow us on Twitter",
        description:
          "We post regular updates, polls, and news about Notesnook and privacy. Follow us to stay updated!",
        components: [
          {
            type: "button",
            action: () =>
              void window.open("https://twitter.com/notesnook", "_blank"),
            title: "Follow",
            variant: "secondary"
          }
        ]
      },
      {
        key: "discord",
        title: "Join our Discord community",
        description:
          "We are not ghosts. Come chat with us and share your experience.",
        components: [
          {
            type: "button",
            action: () =>
              void window.open(
                "https://discord.com/invite/zQBK97EE22",
                "_blank"
              ),
            title: "Join community",
            variant: "secondary"
          }
        ]
      }
    ]
  }
];

export const LegalSettings: SettingsGroup[] = [
  {
    key: "legal",
    section: "legal",
    header: "Legal",
    settings: [
      {
        key: "privacy-policy",
        title: "Privacy policy",
        description:
          "Your privacy is our first & foremost priority. Read our privacy policy to learn about how we protect your privacy while you take your notes.",
        components: [
          {
            type: "button",
            action: () =>
              void window.open("https://notesnook.com/privacy", "_blank"),
            title: "Read privacy policy",
            variant: "secondary"
          }
        ]
      },
      {
        key: "tos",
        title: "Terms of Service",
        description:
          "Read our terms of service to learn about what you have to agree to before using Notesnook.",
        components: [
          {
            type: "button",
            action: () =>
              void window.open("https://notesnook.com/terms", "_blank"),
            title: "Read terms",
            variant: "secondary"
          }
        ]
      }
    ]
  }
];

export const SupportSettings: SettingsGroup[] = [
  {
    key: "support",
    section: "support",
    header: "Help and support",
    settings: [
      {
        key: "report-issue",
        title: "Report an issue",
        description:
          "Facing an issue or have a suggestion? Send us a bug report so we can fix it ASAP!",
        components: [
          {
            type: "button",
            action: showIssueDialog,
            title: "Send bug report",
            variant: "secondary"
          }
        ]
      },
      {
        key: "docs",
        title: "Documentation",
        description: "Learn about every feature in Notesnook and how it works.",
        components: [
          {
            type: "button",
            action: () =>
              void window.open("https://help.notesnook.com/", "_blank"),
            title: "Open docs",
            variant: "secondary"
          }
        ]
      }
    ]
  },
  {
    key: "troubleshooting",
    section: "support",
    header: "Troubleshooting",
    settings: [
      {
        key: "download-logs",
        title: "Debug logs",
        description:
          "All debug logs are stored locally & do not contain any sensitive information.",
        components: [
          {
            type: "button",
            action: downloadLogs,
            title: "Download",
            variant: "secondary"
          },
          {
            type: "button",
            action: clearLogs,
            title: "Clear",
            variant: "errorSecondary"
          }
        ]
      }
    ]
  }
];
