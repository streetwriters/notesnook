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

import { Flex, Text, Button, Input, Switch } from "@theme-ui/components";
import Dialog from "../../components/dialog";
import {
  About,
  Account,
  Appearance,
  Backup,
  Behaviour,
  Desktop,
  Documentation,
  Editor,
  Import,
  Legal,
  Loading,
  Notification,
  PasswordAndAuth,
  Privacy,
  Pro,
  ShieldLock,
  Sync
} from "../../components/icons";
import { Perform } from "../../common/dialog-controller";
import NavigationItem from "../../components/navigation-menu/navigation-item";
import { FlexScrollContainer } from "../../components/scroll-container";
import { useCallback, useEffect, useState } from "react";
import { SectionGroup, SectionKeys, Setting, SettingsGroup } from "./types";
import { ProfileSettings } from "./profile-settings";
import { AuthenticationSettings } from "./auth-settings";
import { useIsUserPremium } from "../../hooks/use-is-user-premium";
import { store as userstore } from "../../stores/user-store";
import { SyncSettings } from "./sync-settings";
import { BehaviourSettings } from "./behaviour-settings";
import { DesktopIntegrationSettings } from "./desktop-integration-settings";
import { NotificationsSettings } from "./notifications-settings";

import { BackupExportSettings } from "./backup-export-settings";
import { ImporterSettings } from "./importer-settings";
import { VaultSettings } from "./vault-settings";
import { PrivacySettings } from "./privacy-settings";
import { EditorSettings } from "./editor-settings";
import {
  AboutSettings,
  LegalSettings,
  SupportSettings
} from "./other-settings";
import { AppearanceSettings } from "./appearance-settings";
import { debounce } from "@notesnook/common";
import { SubscriptionSettings } from "./subscription-settings";
import { alpha } from "@theme-ui/color";
import { ScopedThemeProvider } from "../../components/theme-provider";

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
        isHidden: () => !userstore.get().isLoggedIn
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
      {
        key: "desktop",
        title: "Desktop integration",
        icon: Desktop,
        isHidden: () => !IS_DESKTOP_APP
      },
      { key: "notifications", title: "Notifications", icon: Notification }
    ]
  },
  {
    key: "import-export",
    title: "Import & export",
    sections: [
      { key: "backup-export", title: "Backup & export", icon: Backup },
      { key: "importer", title: "Notesnook Importer", icon: Import }
    ]
  },
  {
    key: "security",
    title: "Security & privacy",
    sections: [
      { key: "vault", title: "Vault", icon: ShieldLock },
      { key: "privacy", title: "Privacy", icon: Privacy }
    ]
  },
  {
    key: "other",
    title: "Other",
    sections: [
      { key: "legal", title: "Legal", icon: Legal },
      { key: "support", title: "Help and support", icon: Documentation },
      { key: "about", title: "About", icon: About }
    ]
  }
];

const SettingsGroups = [
  ...ProfileSettings,
  ...AuthenticationSettings,
  ...SyncSettings,
  ...AppearanceSettings,
  ...BehaviourSettings,
  ...DesktopIntegrationSettings,
  ...NotificationsSettings,
  ...BackupExportSettings,
  ...ImporterSettings,
  ...VaultSettings,
  ...PrivacySettings,
  ...EditorSettings,
  ...LegalSettings,
  ...SupportSettings,
  ...AboutSettings,
  ...SubscriptionSettings
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
  const [activeSettings, setActiveSettings] = useState<SettingsGroup[]>(
    SettingsGroups.filter((g) => g.section === "profile")
  );

  return (
    <Dialog
      isOpen={true}
      width={"968px"}
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
        <SettingsSideBar
          onNavigate={(settings) => setActiveSettings(settings)}
        />
        <FlexScrollContainer
          style={{
            display: "flex",
            backgroundColor: "var(--background)",
            flex: 1,
            flexDirection: "column",
            padding: 20,
            gap: 20,
            minHeight: "min-content",
            overflow: "auto"
          }}
        >
          {activeSettings.map((group) => (
            <SettingsGroupComponent item={group} />
          ))}
        </FlexScrollContainer>
      </Flex>
    </Dialog>
  );
}

type SettingsSideBarProps = { onNavigate: (settings: SettingsGroup[]) => void };
function SettingsSideBar(props: SettingsSideBarProps) {
  const { onNavigate } = props;
  const [route, setRoute] = useState<SectionKeys>("profile");

  return (
    <FlexScrollContainer
      id="settings-side-menu"
      style={{
        width: 240,
        overflow: "auto"
      }}
      data-test-id="settings-navigation-menu"
    >
      <ScopedThemeProvider scope="navigationMenu">
        <Flex
          sx={{
            flexDirection: "column",
            display: "flex",
            overflow: "hidden",
            "@supports ((-webkit-backdrop-filter: none) or (backdrop-filter: none))":
              {
                backgroundColor: alpha("background", 0.6),
                backdropFilter: "blur(8px)"
              },
            backgroundColor: "var(--background-secondary)",
            borderRadius: "dialog"
          }}
        >
          <Input
            placeholder="Search"
            data-test-id="settings-search"
            sx={{
              m: 2,
              mb: 2,
              width: "auto",
              bg: "background",
              py: "7px"
            }}
            onChange={(e) => {
              const query = e.target.value.toLowerCase().trim();
              if (!query)
                return onNavigate(
                  SettingsGroups.filter((g) => g.section === route)
                );

              const groups: SettingsGroup[] = [];
              for (const group of SettingsGroups) {
                const isTitleMatch =
                  typeof group.header === "string" &&
                  group.header.toLowerCase().includes(query);
                const isSectionMatch = group.section.includes(query);

                if (isTitleMatch || isSectionMatch) {
                  groups.push(group);
                  continue;
                }

                const settings = group.settings.filter((setting) => {
                  const description =
                    typeof setting.description === "function"
                      ? setting.description()
                      : setting.description;

                  return [
                    description || "",
                    setting.keywords?.join(" ") || "",
                    setting.title
                  ]
                    .join(" ")
                    ?.toLowerCase()
                    .includes(query);
                });
                if (!settings.length) continue;
                groups.push({ ...group, settings });
              }
              onNavigate(groups);
            }}
          />
          {sectionGroups.map((group) => (
            <Flex key={group.key} sx={{ flexDirection: "column", mb: 2 }}>
              <Text
                variant={"subBody"}
                sx={{
                  fontWeight: "bold",
                  color: "paragraph",
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
                        onNavigate(
                          SettingsGroups.filter(
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
      </ScopedThemeProvider>
    </FlexScrollContainer>
  );
}

function SettingsGroupComponent(props: { item: SettingsGroup }) {
  const { item } = props;
  const { onRender } = item;

  useEffect(() => {
    onRender?.();
  }, [onRender]);

  if (item.isHidden?.()) return null;
  return (
    <Flex
      sx={{
        flexDirection: "column",
        flexShrink: 0,
        gap: 2,
        overflow: "hidden"
      }}
    >
      {typeof item.header === "string" ? (
        <Text
          variant="subBody"
          sx={{
            fontSize: 11,
            fontWeight: "bold",
            letterSpacing: 0.3,
            color: "accent"
          }}
        >
          {item.header.toUpperCase()}
        </Text>
      ) : (
        <item.header />
      )}
      {item.settings.map((setting) => (
        <SettingItem key={setting.key} item={setting} />
      ))}
    </Flex>
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
        flexDirection: "column",
        pb: 4,
        borderBottom: "1px solid var(--separator)"
      }}
      data-test-id={`setting-${item.key}`}
    >
      <Flex
        sx={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "start",
          gap: 4
        }}
      >
        <Flex sx={{ flexDirection: "column" }}>
          <Text variant={"subtitle"}>{item.title}</Text>
          {item.description && (
            <Text
              variant={"body"}
              sx={{ mt: 1, color: "paragraph", whiteSpace: "pre-wrap" }}
            >
              {typeof item.description === "function"
                ? item.description(state)
                : item.description}
            </Text>
          )}
        </Flex>

        <Flex
          sx={{
            alignItems: "center",
            flexShrink: 0,
            justifyContent: "end",
            gap: 2,
            "& > label": { width: "auto" }
          }}
        >
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
                    sx={{ m: 0, background: "accent" }}
                    disabled={isWorking}
                    onChange={() => workWithLoading(component.toggle)}
                    checked={component.isToggled()}
                  />
                );
              case "dropdown":
                return (
                  <select
                    style={{
                      backgroundColor: "var(--background-secondary)",
                      outline: "none",
                      border: "1px solid var(--border-secondary)",
                      borderRadius: "5px",
                      color: "var(--paragraph)",
                      padding: "5px"
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
              case "input":
                return component.inputType === "number" ? (
                  <Input
                    type={"number"}
                    min={component.min}
                    max={component.max}
                    defaultValue={component.defaultValue()}
                    sx={{ width: 80, mr: 1 }}
                    onChange={debounce((e) => {
                      let value = e.target.valueAsNumber;
                      value =
                        Number.isNaN(value) || value < component.min
                          ? component.min
                          : value > component.max
                          ? component.max
                          : value;
                      component.onChange(value);
                    }, 500)}
                  />
                ) : (
                  <Input
                    type={"text"}
                    defaultValue={component.defaultValue()}
                    sx={{ width: 250, mr: 1 }}
                    onChange={debounce(
                      (e) => component.onChange(e.target.value),
                      500
                    )}
                  />
                );
            }
          })}
        </Flex>
      </Flex>
      {components.map((component) =>
        component.type === "custom" ? (
          <component.component key={item.key} />
        ) : null
      )}
    </Flex>
  );
}
