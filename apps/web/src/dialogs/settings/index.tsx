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

import { Flex, Text, Button, Input, Box } from "@theme-ui/components";
import Dialog from "../../components/dialog";
import Field from "../../components/field";
import ToggleSwitch from "../../components/toggle-switch";
import {
  Palette,
  ArrowsClockwise,
  Bell,
  CaretRight,
  ChevronLeftSimple,
  Close,
  CloudArrowDown,
  CloudOutline,
  Compass,
  Download,
  EyeSlash,
  Gavel,
  Info,
  Keyboard,
  Keyhole,
  Laptop,
  Loading,
  Lock,
  SearchIcon,
  PencilSimple,
  Pro,
  Question,
  ShieldCheck,
  Star,
  TrayArrowDown,
  UserProfileIcon,
  Users
} from "../../components/icons";
import NavigationItem from "../../components/navigation-menu/navigation-item";
import { FlexScrollContainer } from "../../components/scroll-container";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  ButtonSettingComponent,
  DropdownSettingComponent,
  Section,
  SectionGroup,
  SettingsSubPage,
  SectionKeys,
  Setting,
  SettingsGroup
} from "./types";
import { ProfileSettings } from "./profile-settings";
import { AuthenticationSettings } from "./auth-settings";
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
import { debounce, useIsFeatureAvailable, usePromise } from "@notesnook/common";
import { SubscriptionSettings } from "./subscription-settings";
import { ScopedThemeProvider } from "../../components/theme-provider";
import { AppLockSettings } from "./app-lock-settings";
import { BaseDialogProps, DialogManager } from "../../common/dialog-manager";
import { ServersSettings } from "./servers-settings";
import { strings } from "@notesnook/intl";
import { useCopyToClipboard } from "../../hooks/use-copy-to-clipboard";
import { mdToHtml } from "../../utils/md";
import { InboxSettings } from "./inbox-settings";
import { withFeatureCheck } from "../../common";
import { NotesnookCircleSettings } from "./notesnook-circle-settings";
import { Select } from "../../components/select";
import {
  IconBox,
  SectionHeading,
  buttonProps
} from "../../components/settings-ui";
import { hashNavigate } from "../../navigation";
import { KeyboardShortcutsDialog } from "../keyboard-shortcuts-dialog";

type SettingsDialogProps = BaseDialogProps<false> & {
  activeSection?: SectionKeys;
};

const sectionGroups: SectionGroup[] = [
  {
    key: "account",
    title: strings.account(),
    sections: [
      { key: "profile", title: strings.profile(), icon: UserProfileIcon },
      {
        key: "subscription",
        title: strings.subDetails(),
        icon: Star,
        isHidden: () => !useUserStore.getState().isLoggedIn
      },
      {
        key: "auth",
        title: strings.authentication(),
        icon: ShieldCheck,
        isHidden: () => !useUserStore.getState().isLoggedIn
      },
      {
        key: "sync",
        title: strings.sync(),
        icon: ArrowsClockwise,
        isHidden: () => !useUserStore.getState().isLoggedIn
      },
      {
        key: "circle",
        title: strings.notesnookCircle(),
        icon: Users,
        isHidden: () => !useUserStore.getState().isLoggedIn
      },
      {
        key: "inbox",
        title: strings.inbox(),
        icon: TrayArrowDown,
        isHidden: () => !useUserStore.getState().isLoggedIn
      }
    ]
  },
  {
    key: "customization",
    title: strings.customization(),
    sections: [
      { key: "appearance", title: strings.appearance(), icon: Palette },
      { key: "behaviour", title: strings.behaviour(), icon: Compass },
      { key: "editor", title: strings.editor(), icon: PencilSimple },
      {
        key: "desktop",
        title: strings.desktopIntegration(),
        icon: Laptop,
        isHidden: () => !IS_DESKTOP_APP
      },
      {
        key: "notifications",
        title: strings.notifications(),
        icon: Bell
      },
      { key: "servers", title: strings.servers(), icon: CloudOutline }
    ]
  },
  {
    key: "import-export",
    title: strings.importExport(),
    sections: [
      {
        key: "backup-export",
        title: strings.backupExport(),
        icon: CloudArrowDown
      },
      { key: "importer", title: strings.notesnookImporter(), icon: Download }
    ]
  },
  {
    key: "security",
    title: strings.privacyAndSecurity(),
    sections: [
      { key: "app-lock", title: strings.appLock(), icon: Lock },
      { key: "vault", title: strings.vault(), icon: Keyhole },
      { key: "privacy", title: strings.privacy(), icon: EyeSlash }
    ]
  },
  {
    key: "other",
    title: strings.other(),
    sections: [
      { key: "legal", title: strings.legal(), icon: Gavel },
      { key: "support", title: strings.helpAndSupport(), icon: Question },
      { key: "about", title: strings.about(), icon: Info },
      {
        key: "keyboard-shortcuts",
        title: strings.keyboardShortcuts(),
        icon: Keyboard,
        action: () => KeyboardShortcutsDialog.show({})
      }
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
  ...ServersSettings,
  ...InboxSettings,
  ...NotesnookCircleSettings
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

type SettingsNavigation = {
  push: (page: SettingsSubPage) => void;
  pop: () => void;
};

const SettingsNavigationContext = createContext<SettingsNavigation>({
  push: () => {},
  pop: () => {}
});

export function useSettingsNavigation() {
  return useContext(SettingsNavigationContext);
}

function scrollSettingsToTop() {
  const scrollbar = document.getElementById("settings-scrollbar");
  if (scrollbar !== null) scrollbar.scrollTop = 0;
}

export const SettingsDialog = DialogManager.register(function SettingsDialog(
  props: SettingsDialogProps
) {
  const [pages, setPages] = useState<SettingsSubPage[]>([]);
  const navigation = useMemo<SettingsNavigation>(
    () => ({
      push: (page) => {
        setPages((pages) => [...pages, page]);
        scrollSettingsToTop();
      },
      pop: () => {
        setPages((pages) => pages.slice(0, -1));
        scrollSettingsToTop();
      }
    }),
    []
  );
  const currentPage = pages.at(-1);
  const [activeSettings, setActiveSettings] = useState<SettingsGroup[]>(
    SettingsGroups.filter(
      (g) => g.section === (props.activeSection || "profile")
    )
  );

  return (
    <SettingsNavigationContext.Provider value={navigation}>
      <Dialog
        isOpen={true}
        width={"100%"}
        height={"100%"}
        onClose={() => props.onClose(false)}
        noScroll
        sx={{
          width: "100%",
          maxWidth: "100%",
          height: "100%",
          maxHeight: "100%",
          borderRadius: 0,
          boxShadow: "none"
        }}
      >
        <Flex
          sx={{
            display: "grid",
            gridTemplateColumns:
              "minmax(20px, 1fr) minmax(0, 1165px) minmax(90px, 1fr)",
            gridTemplateRows: "minmax(0, 1fr)",
            mt: ["10px", "10px", "37px"],
            mb: ["30px", "30px", "57px"],
            flex: 1,
            minHeight: 0
          }}
        >
          <Flex
            sx={{
              gridColumn: 2,
              minWidth: 0,
              minHeight: 0,
              gap: ["spacing4", "spacing4", "spacing9"],
              overflow: "hidden"
            }}
          >
            <SettingsSideBar
              activeSection={props.activeSection}
              onNavigate={(settings) => {
                scrollSettingsToTop();
                setPages([]);
                setActiveSettings(settings);
              }}
            />
            <Box
              sx={{
                width: "1px",
                mr: "-1px",
                flexShrink: 0,
                bg: "separator"
              }}
            />
            <FlexScrollContainer
              id="settings-scrollbar"
              style={{
                flex: 1,
                maxWidth: 810,
                minHeight: "auto",
                padding: 0,
                overflow: "auto"
              }}
            >
              <Flex sx={{ flexDirection: "column", gap: "spacing7" }}>
                {currentPage ? (
                  <SettingsSubPageView
                    page={currentPage}
                    onBack={navigation.pop}
                  />
                ) : activeSettings.length > 0 ? (
                  activeSettings.map((group, index) => (
                    // group keys are not unique, match groups by position
                    <SettingsGroupComponent key={index} item={group} />
                  ))
                ) : (
                  <Text variant="body" sx={{ color: "paragraph-secondary" }}>
                    {strings.noResultsFound()}
                  </Text>
                )}
              </Flex>
            </FlexScrollContainer>
          </Flex>
          <Flex
            {...buttonProps(() => props.onClose(false))}
            aria-label={strings.close()}
            data-test-id="settings-close"
            sx={{
              gridColumn: 3,
              justifySelf: "start",
              alignSelf: "start",
              ml: ["spacing4", "spacing4", "spacing13"],
              width: 20,
              height: 20,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "radius0",
              cursor: "pointer",
              ":hover": { bg: "hover" }
            }}
          >
            <Close size={15} />
          </Flex>
        </Flex>
      </Dialog>
    </SettingsNavigationContext.Provider>
  );
});

function SettingsSubPageView(props: {
  page: SettingsSubPage;
  onBack: () => void;
}) {
  const { page, onBack } = props;
  const PageComponent = page.component;
  return (
    <>
      <Button
        variant="secondary"
        data-test-id="settings-go-back"
        onClick={onBack}
        sx={{
          display: "flex",
          alignItems: "center",
          alignSelf: "flex-start",
          gap: "spacing3",
          px: "spacing6",
          py: "spacing5",
          bg: "background",
          color: "heading",
          fontSize: "sm",
          fontWeight: 600,
          lineHeight: 1,
          border: "1px solid",
          borderColor: "border",
          borderRadius: "radius2",
          ":hover:not(:disabled)": { bg: "hover" }
        }}
      >
        <ChevronLeftSimple size={14} />
        {strings.goBack()}
      </Button>
      <Text
        variant="heading"
        sx={{
          fontSize: "sm",
          fontWeight: 600,
          lineHeight: 1,
          color: "heading"
        }}
      >
        {page.title}
      </Text>
      {page.groups?.map((group, index) => (
        // group keys are not unique, match groups by position
        <SettingsGroupComponent key={index} item={group} />
      ))}
      {PageComponent ? <PageComponent /> : null}
    </>
  );
}

type SettingsSideBarProps = {
  onNavigate: (settings: SettingsGroup[]) => void;
  activeSection?: SectionKeys;
};
function SettingsSideBar(props: SettingsSideBarProps) {
  const { onNavigate, activeSection } = props;
  const [route, setRoute] = useState<SectionKeys>(activeSection || "profile");
  useUserStore((store) => store.isLoggedIn);

  useEffect(() => {
    hashNavigate(`/settings/${route}`, {
      notify: false
    });
  }, [route, activeSection]);

  return (
    <FlexScrollContainer
      id="settings-side-menu"
      className="theme-scope-navigationMenu"
      style={{
        flexShrink: 0,
        overflow: "auto"
      }}
      data-test-id="settings-navigation-menu"
    >
      <ScopedThemeProvider scope="navigationMenu" injectCssVars={false}>
        <Flex
          sx={{
            width: ["100%", "100%", "295px"],
            flexDirection: "column",
            display: "flex",
            overflow: "hidden",
            gap: "spacing7",
            pr: "spacing4"
          }}
        >
          <Text
            variant="heading"
            sx={{
              fontSize: "lg",
              fontWeight: 600,
              lineHeight: 1,
              color: "heading"
            }}
          >
            {strings.settings()}
          </Text>
          <Field
            id="search"
            name="search"
            variant="clean"
            autoFocus
            leftIcon={SearchIcon}
            placeholder="Search settings"
            data-test-id="settings-search"
            sx={{ gap: 0, m: 0, width: "100%", height: "40px" }}
            styles={{
              input: {
                m: 0,
                py: "spacing6",
                pr: "spacing4",
                pl: "spacing10",
                fontSize: "xs",
                color: "paragraph",
                bg: "background-secondary",
                borderRadius: "dialog",
                "::placeholder": {
                  color: "paragraph-secondary",
                  textAlign: "start"
                }
              }
            }}
            onChange={(e) => {
              const query = e.target.value.toLowerCase().trim();
              if (!query)
                return onNavigate(
                  SettingsGroups.filter((g) => g.section === route)
                );

              let groups: SettingsGroup[] = [];
              for (const group of SettingsGroups) {
                const section = findSection(group.section);
                if (section?.isHidden?.() || group.isHidden?.()) continue;

                const isTitleMatch =
                  typeof group.header === "string" &&
                  group.header.toLowerCase().includes(query);
                const isSectionMatch = group.section
                  .toLowerCase()
                  .includes(query);

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
              const matchedSections = findSections(query);
              if (matchedSections.length > 0) {
                const matchedGroups = SettingsGroups.filter((g) =>
                  matchedSections.some((s) => s.key === g.section)
                );
                // remove groups whose sections were matched to avoid duplicate
                // entries.
                groups = groups.filter(
                  (g) => !matchedGroups.some((mg) => mg.section === g.section)
                );
                groups.push(...matchedGroups);
              }
              onNavigate(groups);
            }}
          />
          <Flex sx={{ flexDirection: "column", gap: "spacing4" }}>
            {sectionGroups.map((group) => (
              <Flex
                key={group.key}
                sx={{ flexDirection: "column", gap: "spacing3" }}
              >
                <SectionHeading
                  sx={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    wordSpacing: "nowrap"
                  }}
                >
                  {group.title}
                </SectionHeading>
                <Flex sx={{ flexDirection: "column" }}>
                  {group.sections.map((section) => {
                    if (section.isHidden?.()) return null;
                    if ("action" in section)
                      return (
                        <NavigationItem
                          key={section.key}
                          icon={section.icon}
                          iconSize={15}
                          title={section.title}
                          sx={{ p: "spacing4" }}
                          onClick={section.action}
                        />
                      );
                    return (
                      <NavigationItem
                        key={section.key}
                        icon={section.icon}
                        iconSize={15}
                        title={section.title}
                        sx={{ p: "spacing4" }}
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
                    );
                  })}
                </Flex>
              </Flex>
            ))}
          </Flex>
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

  const allHidden = item.settings.every((s) => s.isHidden?.());
  const hasComponentHeader = typeof item.header !== "string";
  if (item.isHidden?.() || (allHidden && !hasComponentHeader)) return null;

  return (
    <Flex
      sx={{
        flexDirection: "column",
        flexShrink: 0,
        gap: "spacing6"
      }}
    >
      {typeof item.header === "string" ? (
        <SectionHeading sx={{ m: 0 }}>{item.header}</SectionHeading>
      ) : (
        <item.header />
      )}
      <Flex
        sx={{
          flexDirection: "column",
          border: "1px solid",
          borderColor: "border",
          borderRadius: "radius2",
          overflow: "hidden",
          ":empty": { display: "none" },
          "& > *:not(:last-child)": {
            borderBottom: "1px solid",
            borderColor: "border"
          }
        }}
      >
        {item.settings.map((setting) => (
          <SettingItem key={setting.key} item={setting} />
        ))}
      </Flex>
    </Flex>
  );
}

const BUTTON_VARIANTS: Record<ButtonSettingComponent["variant"], string> = {
  primary: "new_accent",
  secondary: "new_secondary",
  bordered: "new_bordered",
  error: "new_error",
  errorSecondary: "new_error_bordered"
};

function SettingButton(props: {
  component: ButtonSettingComponent;
  loading: boolean;
  onClick: () => void;
}) {
  const { component, loading, onClick } = props;
  const { copied, copy } = useCopyToClipboard();
  const label =
    component.copyText && copied ? strings.copied() : component.title;
  return (
    <Button
      disabled={loading}
      title={component.title}
      variant={BUTTON_VARIANTS[component.variant]}
      sx={{
        fontSize: "xs",
        flexShrink: 0,
        ...(component.variant === "errorSecondary"
          ? { borderWidth: "1px" }
          : {})
      }}
      onClick={() => {
        if (component.copyText) {
          const { copyText } = component;
          copy(typeof copyText === "function" ? copyText() : copyText);
          return;
        }
        onClick();
      }}
    >
      <Flex
        sx={{ display: "grid", placeItems: "center", position: "relative" }}
      >
        <Text
          as="span"
          sx={{
            gridArea: "1 / 1",
            color: "inherit",
            visibility:
              loading || label !== component.title ? "hidden" : "visible"
          }}
        >
          {component.title}
        </Text>
        {component.copyText ? (
          <Text
            as="span"
            sx={{
              gridArea: "1 / 1",
              color: "inherit",
              visibility: copied ? "visible" : "hidden"
            }}
          >
            {strings.copied()}
          </Text>
        ) : null}
        {loading ? (
          <Loading
            size={15}
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              marginTop: "-7.5px",
              marginLeft: "-7.5px"
            }}
          />
        ) : null}
      </Flex>
    </Button>
  );
}

function SettingItem(props: { item: Setting }) {
  const { item } = props;
  const [state, setState] = useState<unknown>();
  const [workIndex, setWorkIndex] = useState<number>();
  const feature = useIsFeatureAvailable(item.featureId);
  const settingsNavigation = useSettingsNavigation();

  useEffect(() => {
    if (!item.onStateChange) return;
    const unsubscribe = item.onStateChange((state) => setState(state));
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

  const navigationIndex = components.findIndex((c) => c.type === "navigation");
  const navigation =
    navigationIndex > -1 ? components[navigationIndex] : undefined;
  const onNavigate =
    navigation && navigation.type === "navigation"
      ? withFeatureCheck(feature, () =>
          "page" in navigation
            ? settingsNavigation.push(navigation.page)
            : workWithLoading(navigationIndex, navigation.action)
        )
      : undefined;
  const ItemIcon = item.icon;
  // a row with no title, icon or description that only holds block content
  // (e.g. the inbox API keys empty state) renders just that content
  const headless =
    !item.title &&
    !ItemIcon &&
    !item.description &&
    components.length > 0 &&
    components.every((c) => c.type === "custom" && c.placement !== "trailing");

  return (
    <Flex sx={{ flexDirection: "column" }} data-test-id={`setting-${item.key}`}>
      {headless ? null : (
        <Flex
          {...buttonProps(onNavigate)}
          sx={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            px: "spacing5",
            py: "spacing6",
            gap: "spacing4",
            cursor: onNavigate ? "pointer" : undefined,
            ":hover": onNavigate ? { bg: "hover" } : undefined,
            ":focus-visible": onNavigate
              ? { outline: "none", bg: "hover" }
              : undefined
          }}
        >
          <Flex sx={{ gap: "spacing3", alignItems: "flex-start", flex: 1 }}>
            {ItemIcon ? (
              <IconBox>
                <ItemIcon size={15} />
              </IconBox>
            ) : null}
            <Flex
              sx={{
                flexDirection: "column",
                flex: 1,
                gap: onNavigate ? "spacing3" : "spacing2"
              }}
            >
              <Flex sx={{ alignItems: "center", gap: 1 }}>
                <Text
                  variant={"body"}
                  sx={{
                    fontSize: "sm",
                    fontWeight: 500,
                    lineHeight: 1,
                    color: item.destructive ? "paragraph-error" : "heading"
                  }}
                >
                  {item.title}
                </Text>
                {feature && !feature.isAllowed ? (
                  <Pro size={14} color="orange" />
                ) : null}
              </Flex>
              {item.description && (
                <Text
                  as={"div"}
                  variant={"body"}
                  sx={{
                    fontSize: "xs",
                    lineHeight: 1.2,
                    color: "paragraph",
                    whiteSpace: "pre-wrap",
                    "& p": { m: 0 }
                  }}
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
          </Flex>

          <Flex
            sx={{
              alignItems: "center",
              alignSelf: components.some(
                (c) => c.type === "custom" && c.placement === "trailing"
              )
                ? "flex-start"
                : undefined,
              justifyContent: "end",
              gap: "spacing4",
              "& > label": { width: "auto" },
              "& > *": { flexShrink: 0 }
            }}
          >
            {components.map((component, index) => {
              switch (component.type) {
                case "button":
                  return (
                    <SettingButton
                      key={index}
                      component={component}
                      loading={workIndex === index}
                      onClick={withFeatureCheck(feature, () =>
                        workWithLoading(index, component.action)
                      )}
                    />
                  );
                case "navigation":
                  return workIndex === index ? (
                    <Loading key={index} size={15} />
                  ) : (
                    <CaretRight key={index} size={15} />
                  );
                case "toggle":
                  return (
                    <ToggleSwitch
                      key={index}
                      disabled={workIndex === index}
                      onChange={withFeatureCheck(feature, () =>
                        workWithLoading(index, component.toggle)
                      )}
                      checked={component.isToggled()}
                      data-checked={component.isToggled()}
                    />
                  );
                case "dropdown":
                  return (
                    <SelectComponent
                      key={index}
                      {...component}
                      onSelectionChanged={withFeatureCheck(feature, (value) =>
                        component.onSelectionChanged(value)
                      )}
                    />
                  );
                case "input":
                  return component.inputType === "number" ? (
                    <NumberInput
                      key={component.defaultValue()}
                      min={component.min}
                      max={component.max}
                      step={component.step}
                      defaultValue={component.defaultValue()}
                      onChange={(value) => component.onChange(value)}
                    />
                  ) : (
                    <TextInput
                      key={index}
                      defaultValue={component.defaultValue()}
                      onChange={component.onChange}
                    />
                  );
                case "icon":
                  return (
                    <component.icon
                      key={index}
                      size={component.size}
                      color={component.color}
                    />
                  );
                case "custom":
                  return component.placement === "trailing" ? (
                    <component.component key={index} />
                  ) : null;
                default:
                  return null;
              }
            })}
          </Flex>
        </Flex>
      )}
      {components.map((component, index) =>
        component.type === "custom" && component.placement !== "trailing" ? (
          <Box key={index} sx={{ px: "spacing5", pb: "spacing6" }}>
            <component.component />
          </Box>
        ) : null
      )}
    </Flex>
  );
}

export function SelectComponent(props: Omit<DropdownSettingComponent, "type">) {
  const { onSelectionChanged, options } = props;
  const selectedOption = usePromise(() => props.selectedOption(), [props]);
  const selectedValue =
    selectedOption.status === "fulfilled"
      ? String(selectedOption.value)
      : undefined;

  return (
    <Select
      variant="outline"
      value={selectedValue}
      options={options.map((o) => ({ ...o, value: String(o.value) }))}
      onChange={onSelectionChanged}
      menuPosition={{ align: "end", yOffset: 5 }}
    />
  );
}

/** Like `debounce(fn, ms)`, but keeps one timer across renders and calls the latest `fn`. */
function useDebouncedCallback<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  ms: number
) {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  return useMemo(
    () => debounce((...args: TArgs) => fnRef.current(...args), ms),
    [ms]
  );
}

function TextInput(props: {
  defaultValue: string;
  onChange: (value: string) => void;
}) {
  const { defaultValue, onChange } = props;
  const onChangeDebounced = useDebouncedCallback(onChange, 500);
  return (
    <Input
      type={"text"}
      defaultValue={defaultValue}
      sx={{
        width: 260,
        px: "spacing4",
        py: "spacing6",
        fontSize: "sm",
        lineHeight: 1,
        bg: "transparent",
        border: "1px solid",
        borderColor: "border",
        borderRadius: "radius2",
        outline: "none"
      }}
      onChange={(e) => onChangeDebounced(e.target.value)}
      onBlur={(e) => onChange(e.target.value)}
    />
  );
}

type NumberInputProps = {
  min: number;
  max: number;
  step?: number;
  defaultValue: number;
  onChange: (value: number) => void;
};

function NumberInput({
  min,
  max,
  step,
  defaultValue,
  onChange
}: NumberInputProps) {
  const [isInputValid, setIsInputValid] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const onValueChange = useDebouncedCallback((value: number) => {
    const isValid = !Number.isNaN(value) && value >= min && value <= max;
    setIsInputValid(isValid);
    if (isValid) onChange(value);
  }, 500);

  return (
    <Flex sx={{ flexDirection: "column", alignItems: "flex-end" }}>
      <Input
        ref={inputRef}
        type={"number"}
        min={min}
        max={max}
        step={step}
        defaultValue={defaultValue}
        sx={{
          width: 90,
          p: "spacing5",
          fontSize: "xs",
          fontWeight: 600,
          lineHeight: 1,
          bg: "transparent",
          border: "1px solid",
          borderColor: "border",
          borderRadius: "radius2",
          outline: isInputValid
            ? undefined
            : "2px solid var(--accent-error) !important"
        }}
        onChange={(e) => onValueChange(e.target.valueAsNumber)}
        onBlur={(e) => {
          const raw = e.target.valueAsNumber;
          const clamped =
            Number.isNaN(raw) || raw < min ? min : raw > max ? max : raw;
          if (inputRef.current) inputRef.current.value = String(clamped);
          setIsInputValid(true);
          onChange(clamped);
        }}
      />
      {!isInputValid && (
        <Text
          variant="subBody"
          sx={{ fontSize: 11, color: "error", mt: 1, mr: 1 }}
        >
          {strings.valueMustBeBetween(min, max)}
        </Text>
      )}
    </Flex>
  );
}

function findSection(key: SectionKeys) {
  for (const group of sectionGroups) {
    const section = group.sections.find((s) => s.key === key);
    if (section && !("action" in section)) return section;
  }
  return null;
}

function findSections(query: string) {
  const sections: Section[] = [];
  for (const group of sectionGroups) {
    for (const section of group.sections) {
      if ("action" in section) continue;
      if (section.isHidden?.()) continue;
      if (section.title.toLowerCase().includes(query)) sections.push(section);
    }
  }
  return sections;
}
