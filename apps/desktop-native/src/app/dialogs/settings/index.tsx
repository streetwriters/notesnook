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

import { useCallback, useEffect, useState } from "react";
import { useWindowDimensions } from "react-native";
import { strings } from "@notesnook/intl";
import { environment } from "@platform";
import {
  Button,
  Dialog,
  Flex,
  Input,
  ScrollContainer,
  Select,
  Switch,
  Text,
  ThemeScope
} from "@ui";
import { BaseDialogProps, DialogManager } from "../../common/dialog-manager";
import {
  About,
  Account,
  Appearance,
  Backup,
  Behaviour,
  CellphoneLock,
  CircleEmpty,
  Desktop,
  Documentation,
  Editor,
  Import,
  Inbox,
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
import { NavigationItem } from "../../components/navigation-menu/navigation-item";
import { useStore as useUserStore } from "../../stores/user-store";
import { AppearanceSettings } from "./appearance-settings";
import type {
  DropdownSettingComponent,
  Section,
  SectionGroup,
  SectionKeys,
  Setting,
  SettingsGroup
} from "./types";

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
      },
      {
        key: "circle",
        title: strings.notesnookCircle(),
        icon: CircleEmpty,
        isHidden: () => !useUserStore.getState().isLoggedIn
      },
      {
        key: "inbox",
        title: strings.inbox(),
        icon: Inbox,
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
        isHidden: () => !environment.isDesktopApp
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

const SettingsGroups: SettingsGroup[] = [...AppearanceSettings];

function findSection(key: SectionKeys): Section | undefined {
  for (const group of sectionGroups)
    for (const section of group.sections)
      if (section.key === key) return section;
}

export const SettingsDialog = DialogManager.register(function SettingsDialog(
  props: SettingsDialogProps
) {
  const [route, setRoute] = useState<SectionKeys>(
    props.activeSection || "profile"
  );
  const [query, setQuery] = useState("");
  const groups = query ? searchGroups(query) : groupsOf(route);
  const { width: windowWidth } = useWindowDimensions();

  return (
    <Dialog
      testID="settings-dialog"
      isOpen={true}
      width="968px"
      onClose={() => props.onClose(false)}
      noScroll
      sx={{ bg: "transparent" }}
    >
      <Flex
        sx={{
          flexDirection: "row",
          height: windowWidth * 0.8,
          overflow: "hidden"
        }}
      >
        <SettingsSideBar
          route={route}
          onSearch={setQuery}
          onNavigate={(section) => {
            setQuery("");
            setRoute(section);
          }}
        />
        <ScrollContainer
          testID="settings-content"
          sx={{ flex: 1, bg: "background", p: 20 }}
        >
          <Flex sx={{ flexDirection: "column", gap: 20 }}>
            {groups.length > 0 ? (
              groups.map((group, index) => (
                <SettingsGroupComponent
                  key={`${group.key}-${index}`}
                  item={group}
                />
              ))
            ) : (
              <Text variant="body" sx={{ color: "paragraph-secondary" }}>
                {strings.noResultsFound()}
              </Text>
            )}
          </Flex>
        </ScrollContainer>
      </Flex>
    </Dialog>
  );
});

function groupsOf(section: SectionKeys) {
  return SettingsGroups.filter((group) => group.section === section);
}

function searchGroups(text: string): SettingsGroup[] {
  const query = text.toLowerCase().trim();
  if (!query) return [];
  const result: SettingsGroup[] = [];
  for (const group of SettingsGroups) {
    const section = findSection(group.section);
    if (section?.isHidden?.() || group.isHidden?.()) continue;
    const titleMatch =
      typeof group.header === "string" &&
      group.header.toLowerCase().includes(query);
    if (titleMatch || group.section.toLowerCase().includes(query)) {
      result.push(group);
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
        .toLowerCase()
        .includes(query);
    });
    if (settings.length) result.push({ ...group, settings });
  }
  return result;
}

function SettingsSideBar(props: {
  route: SectionKeys;
  onNavigate: (section: SectionKeys) => void;
  onSearch: (query: string) => void;
}) {
  useUserStore((store) => store.isLoggedIn);
  return (
    <ThemeScope scope="navigationMenu">
      <Flex sx={{ width: 240, flexShrink: 0, bg: "background" }}>
        <ScrollContainer
          testID="settings-navigation-menu"
          sx={{ flex: 1, bg: "background" }}
        >
          <Flex sx={{ flexDirection: "column", gap: 2, overflow: "hidden" }}>
            <Input
              testID="settings-search"
              placeholder={strings.search()}
              onChangeText={props.onSearch}
              sx={{ m: 1, bg: "background", py: "7px" }}
            />
            {sectionGroups.map((group) => (
              <Flex
                key={group.key}
                sx={{ flexDirection: "column", mx: 1, gap: "small" }}
              >
                <Text
                  variant="subBody"
                  sx={{
                    fontWeight: "bold",
                    color: "heading",
                    mb: 1,
                    ml: 1
                  }}
                >
                  {group.title}
                </Text>
                {group.sections.map((section) =>
                  !section.isHidden || !section.isHidden() ? (
                    <NavigationItem
                      key={section.key}
                      icon={section.icon}
                      title={section.title}
                      selected={section.key === props.route}
                      onPress={() => props.onNavigate(section.key)}
                    />
                  ) : null
                )}
              </Flex>
            ))}
          </Flex>
        </ScrollContainer>
      </Flex>
    </ThemeScope>
  );
}

function SettingsGroupComponent(props: { item: SettingsGroup }) {
  const { item } = props;
  const { onRender, onStateChange } = item;
  const [, setState] = useState<unknown>();

  useEffect(() => {
    onRender?.();
  }, [onRender]);

  useEffect(() => {
    const unsubscribe = onStateChange?.(setState);
    return () => {
      unsubscribe?.();
    };
  }, [onStateChange]);

  const allHidden = item.settings.every((setting) => setting.isHidden?.());
  const hasComponentHeader = typeof item.header !== "string";
  if (item.isHidden?.() || (allHidden && !hasComponentHeader)) return null;
  const Header = item.header;

  return (
    <Flex sx={{ flexDirection: "column", flexShrink: 0, gap: 2 }}>
      {typeof Header === "string" ? (
        <Text
          variant="subBody"
          sx={{
            fontSize: 11,
            fontWeight: "bold",
            letterSpacing: 0.3,
            color: "accent"
          }}
        >
          {Header.toUpperCase()}
        </Text>
      ) : (
        <Header />
      )}
      {item.settings.map((setting) => (
        <SettingItem key={setting.key} item={setting} />
      ))}
    </Flex>
  );
}

function plain(markdown: string) {
  return markdown.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[*_`]/g, "");
}

function SettingItem(props: { item: Setting }) {
  const { item } = props;
  const [state, setState] = useState<unknown>();
  const [workIndex, setWorkIndex] = useState<number>();

  useEffect(() => {
    if (!item.onStateChange) return;
    const unsubscribe = item.onStateChange((next) => setState(next));
    return () => {
      unsubscribe?.();
    };
  }, [item]);

  const workWithLoading = useCallback(
    async (index: number, action: () => Promise<unknown> | void) => {
      if (workIndex !== undefined) return;
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
  const description =
    typeof item.description === "function"
      ? item.description(state)
      : item.description;

  return (
    <Flex
      testID={`setting-${item.key}`}
      sx={{
        flexDirection: "column",
        pb: 4,
        borderBottom: "1px solid",
        borderBottomColor: "separator"
      }}
    >
      <Flex
        sx={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 4
        }}
      >
        <Flex sx={{ flexDirection: "column", flex: 1 }}>
          <Text variant="body" sx={{ fontWeight: "medium", color: "heading" }}>
            {item.title}
          </Text>
          {description ? (
            <Text variant="body" sx={{ mt: 1, color: "paragraph" }}>
              {plain(description)}
            </Text>
          ) : null}
        </Flex>
        <Flex
          sx={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 2
          }}
        >
          {components.map((component, index) => {
            switch (component.type) {
              case "button":
                return (
                  <Button
                    key={index}
                    disabled={workIndex === index}
                    variant={component.variant}
                    onPress={() => workWithLoading(index, component.action)}
                  >
                    {workIndex === index ? (
                      <Loading size={18} />
                    ) : (
                      <Text>{component.title}</Text>
                    )}
                  </Button>
                );
              case "toggle":
                return (
                  <Switch
                    key={index}
                    disabled={workIndex === index}
                    checked={component.isToggled()}
                    onChange={() => workWithLoading(index, component.toggle)}
                  />
                );
              case "dropdown":
                return <SelectComponent key={index} {...component} />;
              case "input":
                return component.inputType === "number" ? (
                  <Input
                    key={component.defaultValue()}
                    type="number"
                    defaultValue={String(component.defaultValue())}
                    onChangeText={(text) => {
                      const value = Number(text);
                      if (
                        Number.isFinite(value) &&
                        value >= component.min &&
                        value <= component.max
                      )
                        component.onChange(value);
                    }}
                    sx={{ width: 80 }}
                  />
                ) : (
                  <Input
                    key={index}
                    type="text"
                    defaultValue={component.defaultValue()}
                    onChangeText={component.onChange}
                    sx={{ width: 250, mr: 1 }}
                  />
                );
              case "icon":
                return (
                  <component.icon
                    key={index}
                    size={component.size}
                    color={component.color as never}
                  />
                );
              default:
                return null;
            }
          })}
        </Flex>
      </Flex>
      {components.map((component, index) =>
        component.type === "custom" ? (
          <component.component key={`${item.key}-${index}`} />
        ) : null
      )}
    </Flex>
  );
}

export function SelectComponent(props: Omit<DropdownSettingComponent, "type">) {
  const { onSelectionChanged, options } = props;
  const [selected, setSelected] = useState<string | number>();

  useEffect(() => {
    Promise.resolve(props.selectedOption()).then(setSelected);
  }, [props]);

  return (
    <Select
      options={options}
      value={selected}
      onChange={(value) => {
        setSelected(value);
        onSelectionChanged(value);
      }}
    />
  );
}
