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

import { Flex, Text } from "@ui";
import { isMacStoreApp } from "../../utils/platform";
import {
  Accent,
  Android,
  Anonymous,
  Backup,
  Billboard,
  Cellphone,
  CellphoneLock,
  CheckCircleOutline,
  Chrome,
  CloudLock,
  EncryptedBackup,
  Export,
  FileCabinet,
  Firefox,
  Harddisk,
  Home,
  HTML,
  Icon,
  ImageMultiple,
  Ios,
  Linux,
  Markdown,
  Notebook2,
  Palette,
  PDF,
  Pin,
  Pro,
  Safari,
  ShieldLock,
  Shortcut,
  Table,
  Timebomb,
  Windows,
  Lock,
  MacOs,
  File,
  Embed,
  Text as TextIcon,
  ThemeIcon,
  Sync,
  Refresh,
  Reminder,
  MfaSms,
  MfaAuthenticator,
  MfaEmail,
  CustomToolbar,
  SyncOff
} from "../../components/icons";
import { strings } from "@notesnook/intl";

type Feature = {
  id: string;
  title?: string;
  icon?: Icon;
  pro?: boolean;
};

type Section = {
  title: string;
  detail: string;
  columns?: number;
  info?: string;
  pro?: boolean;
  features?: Feature[];
  isVisible?: () => boolean;
};

const getSections = (): Section[] => [
  {
    title: strings.focusedOnPrivacy(),
    detail: strings.focusedOnPrivacyDesc(),
    features: [
      {
        id: "zero-ads",
        title: strings.zeroAdsAndZeroTrackers(),
        icon: Billboard
      },
      {
        id: "on-device-encryption",
        title: strings.onDeviceEncryption(),
        icon: Cellphone
      },
      {
        id: "secure-app-lock",
        title: strings.secureAppLockForAll(),
        icon: CellphoneLock
      },
      {
        id: "end-to-end-encrypted",
        title: strings.endToEndEncrypted100(),
        icon: Lock
      },
      {
        id: "private-vault",
        title: strings.privateVaultForNotes(),
        icon: ShieldLock,
        pro: true
      }
    ]
  },
  {
    title: strings.instantSyncing(),
    detail: strings.instantSyncingDesc(),
    features: [
      {
        id: "unlimited-devices",
        title: strings.syncToUnlimitedDevices(),
        icon: Cellphone
      },
      {
        id: "real-time-sync",
        title: strings.realTimeEditorSync(),
        icon: Sync
      },
      {
        id: "sync-controls",
        title: strings.granularSyncControls(),
        icon: SyncOff
      }
    ],
    info: strings.granularSyncControlsDesc()
  },
  {
    title: strings.crossPlatform100(),
    detail: strings.crossPlatform100Desc(),
    columns: 8,
    isVisible: () => !isMacStoreApp(),
    features: [
      {
        id: "ios",
        icon: Ios
      },
      {
        id: "android",
        icon: Android
      },
      {
        id: "windows",
        icon: Windows
      },
      {
        id: "linux",
        icon: Linux
      },
      {
        id: "macos",
        icon: MacOs
      },
      {
        id: "chrome",
        icon: Chrome
      },
      {
        id: "firefox",
        icon: Firefox
      },
      {
        id: "safari",
        icon: Safari
      }
    ]
  },
  {
    title: strings.twoFactorAuth(),
    detail: strings.twoFactorAuthFeatureDesc(),
    features: [
      {
        id: "email",
        title: strings.twoFactorEmail(),
        icon: MfaEmail
      },
      {
        id: "auth-app",
        title: strings.authenticatorApp(),
        icon: MfaAuthenticator
      },
      {
        id: "sms",
        title: strings.twoFactorSms(),
        icon: MfaSms,
        pro: true
      }
    ],
    info: strings.twoFactorEmailDesc()
  },
  {
    title: strings.attachFilesAndImages(),
    detail: strings.attachFilesAndImagesDesc(),
    pro: true,
    features: [
      {
        id: "bulletproof-encryption",
        title: strings.bulletproofEncryption(),
        icon: Lock
      },
      {
        id: "4k-images",
        title: strings.highQuality4kImages(),
        icon: ImageMultiple
      },
      {
        id: "unlimited-storage",
        title: strings.unlimitedStorage(),
        icon: Harddisk
      },
      {
        id: "500-mb-files",
        title: strings.upto500MbPerFile(),
        icon: FileCabinet
      },
      {
        id: "file-types",
        title: strings.allFileTypesSupported(),
        icon: File
      }
    ]
  },
  {
    title: strings.noLimitOnNotes(),
    detail: strings.noLimitOnNotesDesc()
  },
  {
    title: strings.crossPlatformReminders(),
    detail: strings.crossPlatformRemindersDesc(),
    features: [
      {
        id: "one-time",
        title: strings.oneTimeReminders(),
        icon: Reminder
      },
      {
        id: "recurring",
        title: strings.recurringRemindersDailyWeeklyMonthly(),
        icon: Refresh,
        pro: true
      }
    ]
  },
  {
    title: strings.safePublishingToInternet(),
    detail: strings.safePublishingToInternetDesc(),
    features: [
      {
        id: "anon-publishing",
        title: strings.anonymousPublishing(),
        icon: Anonymous
      },
      {
        id: "password-protected-publishing",
        title: strings.monographPassHeading(),
        icon: CloudLock
      },
      {
        id: "self-destructive-notes",
        title: strings.selfDestructableNotes(),
        icon: Timebomb
      }
    ]
  },
  {
    title: strings.organizeYourselfBestWay(),
    detail: strings.organizeYourselfBestWayDesc(),
    features: [
      {
        id: "unlimited-notebooks",
        title: strings.unlimitedNotebooksAsterisk(),
        icon: Notebook2,
        pro: true
      },
      {
        id: "colors-tags",
        title: strings.colorsAndTagsAsterisk(),
        icon: Palette,
        pro: true
      },
      {
        id: "side-menu-shortcuts",
        title: strings.sideMenuShortcuts(),
        icon: Shortcut
      },
      {
        id: "pins-favorites",
        title: strings.pinsAndFavorites(),
        icon: Pin
      }
    ],
    info: strings.unlimitedNotebooksInfo()
  },
  {
    title: strings.richToolsForRichEditing(),
    detail: strings.richToolsForRichEditingDesc(),
    features: [
      {
        id: "lists-tables",
        title: strings.listsAndTables(),
        icon: Table
      },
      {
        id: "image-embeds",
        title: strings.imagesAndEmbeds(),
        icon: Embed
      },
      {
        id: "checklists",
        title: strings.checklists(),
        icon: CheckCircleOutline
      },
      {
        id: "md-shortcuts",
        title: strings.mardownShortcuts(),
        icon: Markdown
      },
      {
        id: "custom-toolbar",
        title: strings.customizableToolbarAsterisk(),
        pro: true,
        icon: CustomToolbar
      }
    ],
    info: strings.customizableToolbarInfo()
  },
  {
    title: strings.exportAndTakeNotesAnywhere(),
    detail: strings.exportAndTakeNotesAnywhereDesc(),
    features: [
      {
        id: "export-markdown",
        title: strings.exportAsMarkdown(),
        icon: Markdown,
        pro: true
      },
      {
        id: "export-pdf",
        title: strings.exportAsPdf(),
        icon: PDF,
        pro: true
      },
      {
        id: "export-html",
        title: strings.exportAsHtml(),
        icon: HTML,
        pro: true
      },
      {
        id: "export-txt",
        title: strings.exportAsText(),
        icon: TextIcon
      },
      {
        id: "bulk-exports",
        title: strings.bulkExports(),
        icon: Export
      }
    ]
  },
  {
    title: strings.backupAndKeepNotesSafe(),
    detail: strings.backupAndKeepNotesSafeDesc(),
    features: [
      {
        id: "auto-backups",
        title: strings.autoBackupsMonthlyWeeklyDaily(),
        icon: Backup,
        pro: true
      },
      {
        id: "backup-encryption",
        title: strings.backupEncryption(),
        icon: EncryptedBackup
      }
    ]
  },
  {
    title: strings.personalizeMakeNotesnookYourOwn(),
    detail: strings.personalizeMakeNotesnookYourOwnDesc(),
    features: [
      {
        id: "10-themes",
        title: strings.themes10Plus(),
        icon: Accent
      },
      {
        id: "dark-mode",
        title: strings.automaticDarkMode(),
        icon: ThemeIcon
      },
      {
        id: "default-home-page",
        title: strings.changeDefaultHomePage(),
        icon: Home,
        pro: true
      }
    ]
  }
];

export function Features() {
  const sections = getSections();
  return (
    <Flex
      sx={{
        flex: 1,
        flexDirection: "column",
        flexShrink: 0,
        gap: 50,
        pt: 4,
        bg: "background"
      }}
    >
      {sections.map((section) => {
        if (section.isVisible && !section.isVisible()) return null;
        const columns = section.columns || 3;

        return (
          <Flex key={section.title} sx={{ px: 6, flexDirection: "column" }}>
            {section.pro && (
              <Flex
                sx={{
                  bg: "background-secondary",
                  px: 2,
                  py: "2px",
                  borderRadius: 50,
                  alignSelf: "flex-start",
                  flexDirection: "row",
                  alignItems: "center",
                  mb: 1
                }}
              >
                <Pro color="accent" size={16} />
                <Text variant="body" sx={{ ml: "2px", color: "accent" }}>
                  {strings.pro()}
                </Text>
              </Flex>
            )}
            <Text variant="body" sx={{ fontSize: 20 }}>
              {section.title}
            </Text>
            <Text
              variant="body"
              sx={{ mt: 1, fontSize: "title", color: "paragraph" }}
            >
              {section.detail}
            </Text>
            {section.features && (
              <Flex
                sx={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 3,
                  mt: 4
                }}
              >
                {section.features.map((feature) => (
                  <Flex
                    key={feature.id}
                    sx={{
                      width: `${
                        Math.floor(100 / columns) - 3
                      }%` as `${number}%`,
                      flexDirection: "column",
                      alignItems: "flex-start"
                    }}
                  >
                    {feature.icon && (
                      <Flex sx={{ mb: 1 }}>
                        <feature.icon size={20} />
                      </Flex>
                    )}
                    {feature.pro && (
                      <Flex
                        sx={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        <Pro color="accent" size={14} />
                        <Text
                          variant="subBody"
                          sx={{ ml: "2px", color: "accent" }}
                        >
                          {strings.pro()}
                        </Text>
                      </Flex>
                    )}
                    {feature.title && (
                      <Text variant="body" sx={{ fontSize: "subtitle" }}>
                        {feature.title}
                      </Text>
                    )}
                  </Flex>
                ))}
              </Flex>
            )}
            {section.info && (
              <Text variant="subBody" sx={{ mt: 1 }}>
                {section.info}
              </Text>
            )}
          </Flex>
        );
      })}
    </Flex>
  );
}
