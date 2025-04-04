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
import { appVersion } from "../../utils/version";
import { writeText } from "clipboard-polyfill";
import { showToast } from "../../utils/toast";
import { checkForUpdate, downloadUpdate } from "../../utils/updater";
import { isMacStoreApp } from "../../utils/platform";
import { clearLogs, downloadLogs } from "../../utils/logger";
import { useAutoUpdateStore } from "../../hooks/use-auto-updater";
import { IssueDialog } from "../issue-dialog";
import { strings } from "@notesnook/intl";
import { desktop } from "../../common/desktop-bridge";
import { TaskManager } from "../../common/task-manager";
import { useStore as useSettingStore } from "../../stores/setting-store";

export const AboutSettings: SettingsGroup[] = [
  {
    key: "about",
    section: "about",
    header: strings.about(),
    settings: [
      {
        key: "version",
        title: strings.version(),
        description: () => {
          const status = useAutoUpdateStore.getState().status;
          if (status?.type === "available")
            return strings.newVersionAvailable(status.version);
          return appVersion.formatted;
        },
        onStateChange: (listener) =>
          useAutoUpdateStore.subscribe((s) => s.status, listener),
        components: () => {
          const status = useAutoUpdateStore.getState().status;
          return [
            status?.type === "available"
              ? {
                  type: "button",
                  action: downloadUpdate,
                  title: strings.installUpdate(),
                  variant: "secondary"
                }
              : {
                  type: "button",
                  action: checkForUpdate,
                  title: strings.checkForUpdates(),
                  variant: "secondary"
                },
            {
              type: "button",
              action: async () => {
                await writeText(appVersion.formatted);
                showToast("info", strings.copied());
              },
              title: strings.copy(),
              variant: "secondary"
            }
          ];
        }
      },
      {
        key: "release-track",
        title: strings.releaseTrack(),
        description: strings.releaseTrackDesc(),
        isHidden: () =>
          useSettingStore.getState().isFlatpak ||
          useSettingStore.getState().isSnap,
        components: [
          {
            type: "dropdown",
            options: [
              {
                title: strings.stable(),
                value: "stable"
              },
              {
                title: strings.beta(),
                value: "beta"
              }
            ],
            selectedOption: async () => {
              if (IS_DESKTOP_APP)
                return (
                  (await desktop?.updater.releaseTrack.query()) || "stable"
                );

              return (
                document.cookie
                  .split("; ")
                  .find((row) => row.startsWith("release-track="))
                  ?.split("=")[1] || "stable"
              );
            },
            async onSelectionChanged(value) {
              if (IS_DESKTOP_APP) {
                return await desktop?.updater.changeReleaseTrack.mutate({
                  track: value
                });
              }
              const registration =
                await navigator.serviceWorker.getRegistration();
              if (!registration) return;
              const worker =
                registration.active ||
                registration.waiting ||
                registration.installing;
              if (!worker) return;
              if (worker.state === "activated") {
                await switchReleaseTrack(value);
              } else {
                await TaskManager.startTask({
                  type: "modal",
                  title: "Changing release track",
                  subtitle:
                    "Please wait while we switch to the new release track...",
                  action: () =>
                    new Promise<void>((resolve) => {
                      worker.onstatechange = async function () {
                        if (this.state === "activated") {
                          await switchReleaseTrack(value);
                          resolve();
                        }
                      };
                    })
                });
              }
            }
          }
        ]
      },
      {
        key: "source-code",
        title: strings.sourceCode(),
        description: strings.sourceCodeDescription(),
        components: [
          {
            type: "button",
            action: () => {
              window.open(
                "https://github.com/streetwriters/notesnook",
                "_blank"
              );
            },
            title: strings.viewSourceCode(),
            variant: "secondary"
          }
        ]
      },
      {
        key: "roadmap",
        title: strings.roadmap(),
        description: strings.roadmapDesc(),
        components: [
          {
            type: "button",
            action: () =>
              void window.open("https://notesnook.com/roadmap", "_blank"),
            title: strings.checkRoadmap(),
            variant: "secondary"
          }
        ]
      },
      {
        key: "available-on-mobile",
        title: isMacStoreApp()
          ? strings.availableOnIOS()
          : strings.availableOnIOSAndAndroid(),
        description: isMacStoreApp()
          ? strings.availableOnIOSDescription()
          : strings.availableOnIOSAndAndroidDescription(),
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
            title: strings.network.download(),
            variant: "secondary"
          }
        ]
      }
    ]
  },
  {
    key: "community",
    section: "about",
    header: strings.community(),
    settings: [
      {
        key: "telegram",
        title: strings.joinTelegram(),
        description: strings.joinTelegramDesc(),
        components: [
          {
            type: "button",
            action: () => void window.open("https://t.me/notesnook", "_blank"),
            title: strings.joinTelegram(),
            variant: "secondary"
          }
        ]
      },
      {
        key: "mastodon",
        title: strings.joinMastodon(),
        description: strings.joinMastodonDesc(),
        components: [
          {
            type: "button",
            action: () =>
              void window.open("https://fosstodon.org/@notesnook", "_blank"),
            title: strings.follow(),
            variant: "secondary"
          }
        ]
      },
      {
        key: "twitter",
        title: strings.followOnX(),
        description: strings.followOnXDesc(),
        components: [
          {
            type: "button",
            action: () =>
              void window.open("https://twitter.com/notesnook", "_blank"),
            title: strings.follow(),
            variant: "secondary"
          }
        ]
      },
      {
        key: "discord",
        title: strings.joinDiscord(),
        description: strings.joinDiscordDesc(),
        components: [
          {
            type: "button",
            action: () =>
              void window.open(
                "https://discord.com/invite/zQBK97EE22",
                "_blank"
              ),
            title: strings.joinCommunity(),
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
    header: strings.legal(),
    settings: [
      {
        key: "privacy-policy",
        title: strings.privacyPolicy(),
        description: strings.privacyPolicyDesc(),
        components: [
          {
            type: "button",
            action: () =>
              void window.open("https://notesnook.com/privacy", "_blank"),
            title: strings.open(),
            variant: "secondary"
          }
        ]
      },
      {
        key: "tos",
        title: strings.tos(),
        description: strings.tosDesc(),
        components: [
          {
            type: "button",
            action: () =>
              void window.open("https://notesnook.com/terms", "_blank"),
            title: strings.open(),
            variant: "secondary"
          }
        ]
      },
      {
        key: "license",
        title: strings.license(),
        description: strings.licenseDescription(),
        components: [
          {
            type: "button",
            action: () =>
              void window.open(
                "https://github.com/streetwriters/notesnook/blob/master/LICENSE",
                "_blank"
              ),
            title: strings.open(),
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
    header: strings.helpAndSupport(),
    settings: [
      {
        key: "report-issue",
        title: strings.reportAnIssue(),
        description: strings.reportAnIssueDesc(),
        components: [
          {
            type: "button",
            action: () => IssueDialog.show({}),
            title: strings.report(),
            variant: "secondary"
          }
        ]
      },
      {
        key: "email-us",
        title: strings.emailSupport(),
        description: strings.emailSupportDesc(),
        components: [
          {
            type: "button",
            action: async () => {
              await navigator.clipboard.writeText("support@streetwriters.co");
              showToast("info", strings.copied());
            },
            title: strings.copy(),
            variant: "secondary"
          },
          {
            type: "button",
            action: () => {
              window.open("mailto:support@streetwriters.co", "_blank");
            },
            title: strings.send(),
            variant: "secondary"
          }
        ]
      },
      {
        key: "docs",
        title: strings.documentation(),
        description: strings.documentationDesc(),
        components: [
          {
            type: "button",
            action: () =>
              void window.open("https://help.notesnook.com/", "_blank"),
            title: strings.open(),
            variant: "secondary"
          }
        ]
      }
    ]
  },
  {
    key: "troubleshooting",
    section: "support",
    header: strings.debugging(),
    settings: [
      {
        key: "download-logs",
        title: strings.debugLogs(),
        description: strings.debugLogsDesc(),
        components: [
          {
            type: "button",
            action: downloadLogs,
            title: strings.network.download(),
            variant: "secondary"
          },
          {
            type: "button",
            action: clearLogs,
            title: strings.clear(),
            variant: "errorSecondary"
          }
        ]
      }
    ]
  }
];

async function switchReleaseTrack(track: string) {
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return;
  await registration.unregister();
  for (const key of await caches.keys()) await caches.delete(key);
  document.cookie = `release-track=${track}; Secure; Path=/`;
  window.location.reload();
}
