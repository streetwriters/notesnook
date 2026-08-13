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
// TEMPORARY — used only by the demo data group at the bottom of this file.
import { ConfirmDialog } from "../confirm";
import { useStore as useAppStore } from "../../stores/app-store";
import { useStore as useNoteStore } from "../../stores/note-store";
import { useStore as useNotebookStore } from "../../stores/notebook-store";
import { useStore as useTagStore } from "../../stores/tag-store";
import { useStore as useReminderStore } from "../../stores/reminder-store";

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
          const copyVersionButton: SettingComponent = {
            type: "button",
            action: async () => {
              await writeText(appVersion.formatted);
              showToast("info", strings.copied());
            },
            title: strings.copy(),
            variant: "secondary"
          };
          if (
            useSettingStore.getState().isFlatpak ||
            useSettingStore.getState().isSnap ||
            useSettingStore.getState().isPortable
          ) {
            return [copyVersionButton];
          }

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
            copyVersionButton
          ];
        }
      },
      {
        key: "release-track",
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
  },
  // TEMPORARY — demo data seeder for producing App Store / Play Store
  // screenshots. Delete this group and src/common/seed-demo.ts once the store
  // assets are captured.
  {
    key: "demo-data",
    section: "about",
    header: "Demo data",
    isHidden: () => !import.meta.env.DEV,
    settings: [
      {
        key: "seed-demo-account",
        title: "Seed demo account",
        description:
          "Fills this account with the persona, notebooks, notes, tags, colours, reminders and vault notes the marketing site shows. Run once, on an empty account. Open the notes with pictures afterwards so the images download and become attachments.",
        components: [
          {
            type: "button",
            action: async () => {
              const { seedDemoAccount } = await import("../../common/seed-demo");
              await TaskManager.startTask({
                type: "modal",
                title: "Seeding demo account",
                subtitle: "This takes about a minute. Do not close the app.",
                action: async (report) => {
                  await seedDemoAccount((message) => {
                    console.log("[seed]", message);
                    report({ text: message });
                  });
                }
              });
              await refreshAfterBulkChange();
              showToast("success", "Demo data created. Sync, then capture.");
            },
            title: "Seed",
            variant: "secondary"
          }
        ]
      },
      {
        key: "clear-demo-data",
        title: "Delete all items",
        description:
          "Permanently deletes every note, notebook, tag, colour, reminder and the vault, then empties the trash. The account itself is kept. Cannot be undone.",
        components: [
          {
            type: "button",
            action: async () => {
              // Typed confirmation, not a yes/no: this deletes everything in
              // the account, including anything that was not seeded.
              const result = await ConfirmDialog.show({
                title: "Delete all items",
                message:
                  "This permanently deletes everything in this account — not just the demo data — and empties the trash. It cannot be undone.",
                inputs: {
                  confirmation: {
                    title: 'Type DELETE to confirm',
                    required: true
                  }
                },
                positiveButtonText: strings.delete(),
                negativeButtonText: strings.cancel()
              });
              if (!result) return;
              if (result.inputs?.confirmation?.trim() !== "DELETE") {
                showToast("error", "Type DELETE to confirm.");
                return;
              }

              const { clearAllData } = await import("../../common/seed-demo");
              let counts: Awaited<ReturnType<typeof clearAllData>> | undefined;
              await TaskManager.startTask({
                type: "modal",
                title: "Deleting all items",
                subtitle: "Please wait.",
                action: async (report) => {
                  counts = await clearAllData((message) => {
                    console.log("[seed]", message);
                    report({ text: message });
                  });
                }
              });
              await refreshAfterBulkChange();
              showToast(
                "success",
                counts
                  ? `Deleted ${counts.notes} notes, ${counts.notebooks} notebooks, ${counts.tags} tags, ${counts.reminders} reminders.`
                  : "Account cleared."
              );
            },
            title: "Delete",
            variant: "error"
          }
        ]
      }
    ]
  }
];

/**
 * Both demo actions rewrite the whole database underneath the UI. The stores
 * read from a cache that does not know that happened, so without this the app
 * keeps rendering the previous account until a reload.
 */
async function refreshAfterBulkChange() {
  await useAppStore.getState().refreshNavItems();
  await useNoteStore.getState().refresh();
  await useNotebookStore.getState().refresh();
  await useTagStore.getState().refresh();
  await useReminderStore.getState().refresh();
}

async function switchReleaseTrack(track: string) {
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return;
  await registration.unregister();
  for (const key of await caches.keys()) await caches.delete(key);
  document.cookie = `release-track=${track}; Secure; Path=/; max-age=2147483647`;
  window.location.reload();
}
