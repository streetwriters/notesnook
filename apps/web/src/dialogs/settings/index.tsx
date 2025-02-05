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
  CellphoneLock,
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
  Servers,
  ShieldLock,
  Sync
} from "../../components/icons";
import NavigationItem from "../../components/navigation-menu/navigation-item";
import { FlexScrollContainer } from "../../components/scroll-container";
import { useCallback, useEffect, useState } from "react";
import {
  DropdownSettingComponent,
  SectionGroup,
  SectionKeys,
  Setting,
  SettingsGroup
} from "./types";
import { ProfileSettings } from "./profile-settings";
import { AuthenticationSettings } from "./auth-settings";
import { useIsUserPremium } from "../../hooks/use-is-user-premium";
import { useStore as useUserStore } from "../../stores/user-store";
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
import { debounce, usePromise } from "@notesnook/common";
import { SubscriptionSettings } from "./subscription-settings";
import { ScopedThemeProvider } from "../../components/theme-provider";
import { AppLockSettings } from "./app-lock-settings";
import { BaseDialogProps, DialogManager } from "../../common/dialog-manager";
import { ServersSettings } from "./servers-settings";
import { strings } from "@notesnook/intl";
import { mdToHtml } from "../../utils/md";

type SettingsDialogProps = BaseDialogProps<false> & {
  activeSection?: SectionKeys;
};

const sectionGroups: SectionGroup[] = [
  {
    key: "account",
    title: strings.account(),
    sections: [
      { key: "profile", title: strings.profile(), icon: Account },
      {
        key: "subscription",
        title: strings.subDetails(),
        icon: Pro,
        isHidden: () => !useUserStore.getState().isLoggedIn
      },
      {
        key: "auth",
        title: strings.authentication(),
        icon: PasswordAndAuth,
        isHidden: () => !useUserStore.getState().isLoggedIn
      },
      {
        key: "sync",
        title: strings.sync(),
        icon: Sync,
        isHidden: () => !useUserStore.getState().isLoggedIn
      }
    ]
  },
  {
    key: "customization",
    title: strings.customization(),
    sections: [
      { key: "appearance", title: strings.appearance(), icon: Appearance },
      { key: "behaviour", title: strings.behaviour(), icon: Behaviour },
      { key: "editor", title: strings.editor(), icon: Editor },
      {
        key: "desktop",
        title: strings.desktopIntegration(),
        icon: Desktop,
        isHidden: () => !IS_DESKTOP_APP
      },
      {
        key: "notifications",
        title: strings.notifications(),
        icon: Notification
      },
      { key: "servers", title: strings.servers(), icon: Servers }
    ]
  },
  {
    key: "import-export",
    title: strings.importExport(),
    sections: [
      { key: "backup-export", title: strings.backupExport(), icon: Backup },
      { key: "importer", title: strings.notesnookImporter(), icon: Import }
    ]
  },
  {
    key: "security",
    title: strings.privacyAndSecurity(),
    sections: [
      { key: "app-lock", title: strings.appLock(), icon: CellphoneLock },
      { key: "vault", title: strings.vault(), icon: ShieldLock },
      { key: "privacy", title: strings.privacy(), icon: Privacy }
    ]
  },
  {
    key: "other",
    title: strings.other(),
    sections: [
      { key: "legal", title: strings.legal(), icon: Legal },
      { key: "support", title: strings.helpAndSupport(), icon: Documentation },
      { key: "about", title: strings.about(), icon: About }
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
  ...AppLockSettings,
  ...VaultSettings,
  ...PrivacySettings,
  ...EditorSettings,
  ...LegalSettings,
  ...SupportSettings,
  ...AboutSettings,
  ...SubscriptionSettings,
  ...ServersSettings
];

// Thoughts:
// 1. Settings will be conditional
//    - For example settings which have an enablement placeholder
//    - Or settings that appear after another setting is enabled.
//    - Or settings that are visible after a user signs in
// 2. Settings will be synced so their state must be serializable
// 3. Settings will be grouped
//    - Where group header is customizable
// 4. Sections/groups must be able to accommodate tips & tutorials for future.
// 5. Settings will be stateful but independent such that any one setting
// can appear independent of others (e.g. as a search result)

export const SettingsDialog = DialogManager.register(function SettingsDialog(
  props: SettingsDialogProps
) {
  const [activeSettings, setActiveSettings] = useState<SettingsGroup[]>(
    SettingsGroups.filter(
      (g) => g.section === (props.activeSection || "profile")
    )
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
          activeSection={props.activeSection}
          onNavigate={(settings) => {
            const scrollbar = document.getElementById("settings-scrollbar");
            if (scrollbar !== null) scrollbar.scrollTop = 0;
            setActiveSettings(settings);
          }}
        />
        <FlexScrollContainer
          id="settings-scrollbar"
          style={{
            display: "flex",
            backgroundColor: "var(--background)",
            flex: 1,
            flexDirection: "column",
            padding: 20,
            gap: 20,
            minHeight: "auto",
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
});

type SettingsSideBarProps = {
  onNavigate: (settings: SettingsGroup[]) => void;
  activeSection?: SectionKeys;
};
function SettingsSideBar(props: SettingsSideBarProps) {
  const { onNavigate, activeSection } = props;
  const [route, setRoute] = useState<SectionKeys>(activeSection || "profile");
  useUserStore((store) => store.isLoggedIn);

  return (
    <FlexScrollContainer
      id="settings-side-menu"
      className="theme-scope-navigationMenu"
      style={{
        width: 240,
        overflow: "auto",
        backgroundColor: "var(--background)"
      }}
      data-test-id="settings-navigation-menu"
    >
      <ScopedThemeProvider scope="navigationMenu" injectCssVars={false}>
        <Flex
          sx={{
            flexDirection: "column",
            display: "flex",
            overflow: "hidden"
          }}
        >
          <Input
            id="search"
            name="search"
            placeholder={strings.search()}
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
                  mb: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  wordSpacing: "nowrap"
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
  const { onRender, onStateChange } = item;

  const [_, setState] = useState<unknown>();

  useEffect(() => {
    onRender?.();
  }, [onRender]);

  useEffect(() => {
    const unsubscribe = onStateChange?.(setState);
    return () => {
      unsubscribe?.();
    };
  }, [onStateChange]);

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
  const [workIndex, setWorkIndex] = useState<number>();
  const isUserPremium = useIsUserPremium();

  useEffect(() => {
    if (!item.onStateChange) return;
    const unsubscribe = item.onStateChange(setState);
    return () => {
      unsubscribe?.();
    };
  }, [item]);

  const workWithLoading = useCallback(
    async (index: number, action: () => Promise<unknown> | void) => {
      if (workIndex) return;
      try {
        setWorkIndex(index);
        await action();
      } finally {
        setWorkIndex(undefined);
      }
    },
    [workIndex]
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
        <Flex sx={{ flexDirection: "column", flex: 1 }}>
          <Text variant={"subtitle"}>{item.title}</Text>
          {item.description && (
            <Text
              as={"div"}
              variant={"body"}
              sx={{ mt: 1, color: "paragraph", whiteSpace: "pre-wrap" }}
              dangerouslySetInnerHTML={{
                __html: mdToHtml(
                  typeof item.description === "function"
                    ? item.description(state)
                    : item.description
                )
              }}
            />
          )}
        </Flex>

        <Flex
          sx={{
            alignItems: "center",
            justifyContent: "end",
            gap: 2,
            "& > label": { width: "auto" },
            "& > *": { flexShrink: 0 }
          }}
        >
          {components.map((component, index) => {
            switch (component.type) {
              case "button":
                return (
                  <Button
                    disabled={workIndex === index}
                    title={component.title}
                    variant={component.variant}
                    onClick={() => workWithLoading(index, component.action)}
                  >
                    {workIndex === index ? (
                      <Loading size={18} sx={{ mr: 2 }} />
                    ) : (
                      component.title
                    )}
                  </Button>
                );
              case "toggle":
                return (
                  <Switch
                    sx={{
                      m: 0,
                      background: component.isToggled()
                        ? "accent"
                        : "icon-secondary"
                    }}
                    disabled={workIndex === index}
                    onChange={() => workWithLoading(index, component.toggle)}
                    checked={component.isToggled()}
                    data-checked={component.isToggled()}
                  />
                );
              case "dropdown":
                return (
                  <SelectComponent
                    {...component}
                    isUserPremium={isUserPremium}
                  />
                );
              case "input":
                return component.inputType === "number" ? (
                  <Input
                    type={"number"}
                    min={component.min}
                    max={component.max}
                    step={component.step}
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
              case "icon":
                return (
                  <component.icon
                    size={component.size}
                    color={component.color}
                  />
                );
              default:
                return null;
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

function SelectComponent(
  props: DropdownSettingComponent & { isUserPremium: boolean }
) {
  const { onSelectionChanged, options, isUserPremium } = props;
  const selectedOption = usePromise(() => props.selectedOption(), [props]);

  return (
    <select
      style={{
        backgroundColor: "var(--background-secondary)",
        outline: "none",
        border: "1px solid var(--border-secondary)",
        borderRadius: "5px",
        color: "var(--paragraph)",
        padding: "5px",
        overflow: "hidden"
      }}
      value={
        selectedOption.status === "fulfilled" ? selectedOption.value : undefined
      }
      onChange={(e) =>
        onSelectionChanged((e.target as HTMLSelectElement).value)
      }
    >
      {options.map((option) => (
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
