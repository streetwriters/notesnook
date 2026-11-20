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

import { SettingComponent, SettingsGroup } from "./types";
import { appVersion } from "../../utils/version";
import { checkForUpdate, downloadUpdate } from "../../utils/updater";
import { isMacStoreApp } from "../../utils/platform";
import { clearLogs, downloadLogs } from "../../utils/logger";
import { useAutoUpdateStore } from "../../hooks/use-auto-updater";
import { IssueDialog } from "../issue-dialog";
import { strings } from "@notesnook/intl";
import { desktop } from "../../common/desktop-bridge";
import { TaskManager } from "../../common/task-manager";
import { useStore as useSettingStore } from "../../stores/setting-store";
import {
  GithubLogo,
  Path,
  TelegramLogo,
  XLogo,
  DiscordLogo,
  MastodonLogo,
  BracketsAngle,
  RoadHorizon,
  DeviceMobileCamera,
  EyeSlash,
  FileText,
  IdentificationBadge,
  WarningTriangle,
  Email,
  FileDoc,
  BugBeetle
} from "../../components/icons";

async function checkForUpdateAndWait() {
  await checkForUpdate();
  if (useAutoUpdateStore.getState().status?.type !== "checking") return;
  await new Promise<void>((resolve) => {
    const timeout = setTimeout(done, 15000);
    const unsubscribe = useAutoUpdateStore.subscribe(
      (s) => s.status,
      (status) => {
        if (status?.type !== "checking") done();
      }
    );
    function done() {
      clearTimeout(timeout);
      unsubscribe();
      resolve();
    }
  });
}

export const AboutSettings: SettingsGroup[] = [
  {
    key: "about",
    section: "about",
    header: strings.about(),
    settings: [
      {
        key: "version",
        icon: GithubLogo,
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
          const copyVersionButton: SettingComponent = {
            type: "button",
            action: () => {},
            copyText: appVersion.formatted,
            title: strings.copy(),
            variant: "bordered"
          };
          if (
            useSettingStore.getState().isFlatpak ||
            useSettingStore.getState().isSnap ||
            useSettingStore.getState().isPortable
          ) {
            return [copyVersionButton];
          }

          return [
            copyVersionButton,
            status?.type === "available"
              ? {
                  type: "button",
                  action: downloadUpdate,
                  title: strings.installUpdate(),
                  variant: "secondary"
                }
              : {
                  type: "button",
                  action: checkForUpdateAndWait,
                  title: strings.checkForUpdates(),
                  variant: "secondary"
                }
          ];
        }
      },
      {
        key: "release-track",
        icon: Path,
        title: strings.releaseTrack(),
        description: strings.releaseTrackDesc(),
        isHidden: () =>
          useSettingStore.getState().isFlatpak ||
          useSettingStore.getState().isSnap ||
          useSettingStore.getState().isPortable,
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
                  title: strings.changingReleaseTrack(),
                  subtitle: strings.changingReleaseTrackWait(),
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
        icon: BracketsAngle,
        title: strings.sourceCode(),
        description: strings.sourceCodeDescription(),
        components: [
          {
            type: "navigation",
            action: () => {
              window.open(
                "https://github.com/streetwriters/notesnook",
                "_blank"
              );
            }
          }
        ]
      },
      {
        key: "roadmap",
        icon: RoadHorizon,
        title: strings.roadmap(),
        description: strings.roadmapDesc(),
        components: [
          {
            type: "navigation",
            action: () =>
              void window.open("https://notesnook.com/roadmap", "_blank")
          }
        ]
      },
      {
        key: "available-on-mobile",
        icon: DeviceMobileCamera,
        title: isMacStoreApp()
          ? strings.availableOnIOS()
          : strings.availableOnIOSAndAndroid(),
        description: isMacStoreApp()
          ? strings.availableOnIOSDescription()
          : strings.availableOnIOSAndAndroidDescription(),
        components: [
          {
            type: "navigation",
            action: () =>
              void window.open(
                isMacStoreApp()
                  ? "https://apps.apple.com/us/app/notesnook-take-private-notes/id1544027013"
                  : "https://notesnook.com/downloads",
                "_blank"
              )
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
        icon: TelegramLogo,
        title: strings.joinTelegram(),
        description: strings.joinTelegramDesc(),
        components: [
          {
            type: "navigation",
            action: () => void window.open("https://t.me/notesnook", "_blank")
          }
        ]
      },
      {
        key: "twitter",
        icon: XLogo,
        title: strings.followOnX(),
        description: strings.followOnXDesc(),
        components: [
          {
            type: "navigation",
            action: () =>
              void window.open("https://twitter.com/notesnook", "_blank")
          }
        ]
      },
      {
        key: "discord",
        icon: DiscordLogo,
        title: strings.joinDiscord(),
        description: strings.joinDiscordDesc(),
        components: [
          {
            type: "navigation",
            action: () =>
              void window.open(
                "https://discord.com/invite/zQBK97EE22",
                "_blank"
              )
          }
        ]
      },
      {
        key: "mastodon",
        icon: MastodonLogo,
        title: strings.joinMastodon(),
        description: strings.joinMastodonDesc(),
        components: [
          {
            type: "navigation",
            action: () =>
              void window.open("https://fosstodon.org/@notesnook", "_blank")
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
        icon: EyeSlash,
        title: strings.privacyPolicy(),
        description: strings.privacyPolicyDesc(),
        components: [
          {
            type: "navigation",
            action: () =>
              void window.open("https://notesnook.com/privacy", "_blank")
          }
        ]
      },
      {
        key: "tos",
        icon: FileText,
        title: strings.tos(),
        description: strings.tosDesc(),
        components: [
          {
            type: "navigation",
            action: () =>
              void window.open("https://notesnook.com/terms", "_blank")
          }
        ]
      },
      {
        key: "license",
        icon: IdentificationBadge,
        title: strings.license(),
        description: strings.licenseDescription(),
        components: [
          {
            type: "navigation",
            action: () =>
              void window.open(
                "https://github.com/streetwriters/notesnook/blob/master/LICENSE",
                "_blank"
              )
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
        icon: WarningTriangle,
        title: strings.reportAnIssue(),
        description: strings.reportAnIssueDesc(),
        components: [
          {
            type: "navigation",
            action: () => void IssueDialog.show({})
          }
        ]
      },
      {
        key: "email-us",
        icon: Email,
        title: strings.emailSupport(),
        description: strings.emailSupportDesc(),
        components: [
          {
            type: "button",
            action: () => {},
            copyText: "support@streetwriters.co",
            title: strings.copy(),
            variant: "bordered"
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
        icon: FileDoc,
        title: strings.documentation(),
        description: strings.documentationDesc(),
        components: [
          {
            type: "navigation",
            action: () =>
              void window.open("https://notesnook.com/help/", "_blank")
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
        icon: BugBeetle,
        title: strings.debugLogs(),
        description: strings.debugLogsDesc(),
        components: [
          {
            type: "button",
            action: clearLogs,
            title: strings.clear(),
            variant: "errorSecondary"
          },
          {
            type: "button",
            action: downloadLogs,
            title: strings.network.download(),
            variant: "secondary"
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
  document.cookie = `release-track=${track}; Secure; Path=/; max-age=2147483647`;
  window.location.reload();
}
