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

import { Flex, Text, Button, Input, Switch, Box } from "@theme-ui/components";
import Dialog from "../dialog";
import {
  About,
  Account,
  Appearance,
  Backup,
  Behaviour,
  Desktop,
  Developer,
  Documentation,
  Editor,
  Export,
  Import,
  Legal,
  Loading,
  Notification,
  PasswordAndAuth,
  Privacy,
  Pro,
  ShieldLock,
  Sync
} from "../../icons";
import { Perform } from "../../../common/dialog-controller";
import NavigationItem from "../../navigation-menu/navigation-item";
import { FlexScrollContainer } from "../../scroll-container";
import { useCallback, useEffect, useState } from "react";
import { SectionGroup, SectionKeys, Setting, SettingsGroup } from "./types";
import { ProfileSettings } from "./profile-settings";
import { AuthenticationSettings } from "./auth-settings";
import {
  isUserSubscribed,
  useIsUserPremium
} from "../../../hooks/use-is-user-premium";
import { store as userstore } from "../../../stores/user-store";
import { SyncSettings } from "./sync-settings";
import { BehaviourSettings } from "./behaviour-settings";
import { DesktopIntegrationSettings } from "./desktop-integration-settings";
import { NotificationsSettings } from "./notifications-settings";

type SettingsDialogProps = { onClose: Perform };

const sectionGroups: SectionGroup[] = [
  {
    key: "account",
    title: "User account",
    sections: [
      { key: "profile", title: "Profile", icon: Account },
      {
        key: "subscription",
        title: "Subscription",
        icon: Pro,
        isHidden: () => !isUserSubscribed()
      },
      {
        key: "auth",
        title: "Authentication",
        icon: PasswordAndAuth,
        isHidden: () => !userstore.get().isLoggedIn
      },
      {
        key: "sync",
        title: "Sync",
        icon: Sync,
        isHidden: () => !userstore.get().isLoggedIn
      }
    ]
  },
  {
    key: "customization",
    title: "Customization",
    sections: [
      { key: "appearance", title: "Appearance", icon: Appearance },
      { key: "behaviour", title: "Behaviour", icon: Behaviour },
      { key: "editor", title: "Editor", icon: Editor },
      { key: "desktop", title: "Desktop integration", icon: Desktop },
      { key: "notifications", title: "Notifications", icon: Notification }
    ]
  },
  {
    key: "import-export",
    title: "Import & export",
    sections: [
      { key: "backup-restore", title: "Backup & restore", icon: Backup },
      { key: "importer", title: "Notesnook Importer", icon: Import },
      { key: "export", title: "Export", icon: Export }
    ]
  },
  {
    key: "security",
    title: "Security",
    sections: [
      { key: "vault", title: "Vault", icon: ShieldLock },
      { key: "privacy", title: "Privacy", icon: Privacy }
    ]
  },
  {
    key: "miscellaneous",
    title: "Miscellaneous",
    sections: [
      { key: "legal", title: "Legal", icon: Legal },
      { key: "support", title: "Support", icon: Documentation },
      { key: "developer", title: "Developer settings", icon: Developer },
      { key: "about", title: "About", icon: About }
    ]
  }
];

const settingsGroups = [
  ...ProfileSettings,
  ...AuthenticationSettings,
  ...SyncSettings,
  ...BehaviourSettings,
  ...DesktopIntegrationSettings,
  ...NotificationsSettings
];

// Thoughts:
// 1. Settings will be conditional
//    - For example settings which have an enablement placeholder
//    - Or settings that appear after another setting is enabled.
//    - Or settings that are visible after a user signs in
// 2. Settings will be synced so their state must be serializable
// 3. Settings will be grouped
//    - Where group header is customizable
// 4. Sections/groups must be able to accomodate tips & tutorials for future.
// 5. Settings will be stateful but independent such that any one setting
// can appear independent of others (e.g. as a search result)

export default function SettingsDialog(props: SettingsDialogProps) {
  const [route, setRoute] = useState<SectionKeys>("profile");
  const [activeSettings, setActiveSettings] = useState<SettingsGroup[]>(
    settingsGroups.filter((g) => g.section === route)
  );

  return (
    <Dialog
      isOpen={true}
      width={"55%"}
      onClose={() => props.onClose(false)}
      noScroll
      sx={{ bg: "transparent" }}
    >
      <Flex
        sx={{
          height: "80vw",
          overflow: "hidden"
        }}
      >
        <FlexScrollContainer>
          <Flex
            sx={{
              flexDirection: "column",
              width: 240,
              overflow: "hidden",
              minHeight: "min-content",
              bg: "bgSecondary",
              "@supports ((-webkit-backdrop-filter: none) or (backdrop-filter: none))":
                {
                  bg: "bgTransparent",
                  backdropFilter: "blur(8px)"
                }
            }}
          >
            <Input
              placeholder="Search"
              sx={{ m: 2, mb: 2, width: "auto", bg: "bgSecondary", py: "7px" }}
              onChange={(e) => {
                const query = e.target.value.toLowerCase().trim();
                if (!query)
                  return setActiveSettings(
                    settingsGroups.filter((g) => g.section === route)
                  );

                const groups: SettingsGroup[] = [];
                for (const group of settingsGroups) {
                  const isTitleMatch =
                    typeof group.header === "string" &&
                    group.header.toLowerCase().includes(query);

                  if (isTitleMatch) {
                    groups.push(group);
                    continue;
                  }

                  const settings = group.settings.filter(
                    (setting) =>
                      setting.description?.toLowerCase().includes(query) ||
                      setting.keywords?.some((keyword) =>
                        keyword.toLowerCase().includes(query)
                      ) ||
                      setting.title.toLowerCase().includes(query)
                  );
                  if (!settings.length) continue;
                  groups.push({ ...group, settings });
                }
                setActiveSettings(groups);
              }}
            />
            {sectionGroups.map((group) => (
              <Flex key={group.key} sx={{ flexDirection: "column", mb: 2 }}>
                <Text
                  variant={"subBody"}
                  sx={{
                    fontWeight: "bold",
                    color: "text",
                    mx: 3,
                    mb: 1
                  }}
                >
                  {group.title}
                </Text>
                {group.sections.map(
                  (section) =>
                    (!section.isHidden || !section.isHidden()) && (
                      <NavigationItem
                        key={section.key}
                        icon={section.icon}
                        title={section.title}
                        selected={section.key === route}
                        onClick={() => {
                          setActiveSettings(
                            settingsGroups.filter(
                              (g) => g.section === section.key
                            )
                          );
                          setRoute(section.key);
                        }}
                      />
                    )
                )}
              </Flex>
            ))}
          </Flex>
        </FlexScrollContainer>
        <Flex
          sx={{
            flexDirection: "column",
            bg: "background",
            flex: 1,
            p: 4,
            gap: 4
          }}
        >
          {activeSettings.map(
            (group) =>
              (!group.isHidden || !group.isHidden()) && (
                <Flex key={group.key} sx={{ flexDirection: "column", gap: 2 }}>
                  {typeof group.header === "string" ? (
                    <Text
                      variant="subBody"
                      sx={{
                        fontSize: 11,
                        fontWeight: "bold",
                        letterSpacing: 0.3,
                        color: "primary"
                      }}
                    >
                      {group.header.toUpperCase()}
                    </Text>
                  ) : (
                    <group.header />
                  )}
                  {group.settings.map((setting) => (
                    <SettingItem key={setting.key} item={setting} />
                  ))}
                </Flex>
              )
          )}
        </Flex>
      </Flex>
    </Dialog>
  );
}

function SettingItem(props: { item: Setting }) {
  const { item } = props;
  const [state, setState] = useState<unknown>();
  const [isWorking, setIsWorking] = useState(false);
  const isUserPremium = useIsUserPremium();

  useEffect(() => {
    if (!item.onStateChange) return;
    item.onStateChange(setState);
  }, [item]);

  const workWithLoading = useCallback(
    async (action) => {
      if (isWorking) return;
      try {
        setIsWorking(true);
        await action();
      } finally {
        setIsWorking(false);
      }
    },
    [isWorking]
  );

  if (item.isHidden && item.isHidden(state)) return null;

  const components =
    typeof item.components === "function"
      ? item.components(state)
      : item.components;

  return (
    <Flex
      sx={{
        flexDirection: "row",
        justifyContent: "space-between",
        pb: 4,
        // mb: 4,
        gap: 4,
        borderBottom: "1px solid var(--border)"
      }}
    >
      <Flex sx={{ flexDirection: "column" }}>
        <Text variant={"subtitle"}>{item.title}</Text>
        {item.description && (
          <Text variant={"body"} sx={{ mt: 1, color: "fontTertiary" }}>
            {item.description}
          </Text>
        )}
      </Flex>

      <Flex sx={{ alignItems: "center", flexShrink: 0 }}>
        {components.map((component) => {
          switch (component.type) {
            case "button":
              return (
                <Button
                  disabled={isWorking}
                  title={component.title}
                  variant={component.variant}
                  onClick={() => workWithLoading(component.action)}
                >
                  {isWorking ? (
                    <Loading size={18} sx={{ mr: 2 }} />
                  ) : (
                    component.title
                  )}
                </Button>
              );
            case "toggle":
              return (
                <Switch
                  disabled={isWorking}
                  onChange={() => workWithLoading(component.toggle)}
                  checked={component.isToggled()}
                />
              );
            case "dropdown":
              return (
                <select
                  style={{
                    backgroundColor: "var(--bgSecondary)",
                    outline: "none",
                    border: "1px solid var(--border)",
                    borderRadius: "5px"
                  }}
                  value={component.selectedOption()}
                  onChange={(e) =>
                    component.onSelectionChanged(
                      (e.target as HTMLSelectElement).value
                    )
                  }
                >
                  {component.options.map((option) => (
                    <option
                      disabled={option.premium && !isUserPremium}
                      key={option.value}
                      value={option.value}
                    >
                      {option.title}
                    </option>
                  ))}
                </select>
              );
          }
        })}
      </Flex>
    </Flex>
  );
}
