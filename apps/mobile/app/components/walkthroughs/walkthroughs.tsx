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

import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import React from "react";
import { Linking, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import {
  COMMUNITY_SVG,
  LAUNCH_ROCKET,
  SUPPORT_SVG,
  WELCOME_SVG
} from "../../assets/images/assets";
import useRotator from "../../hooks/use-rotator";
import { eSendEvent } from "../../services/event-manager";
import { getContainerBorder } from "../../utils/colors";
import { getElevationStyle } from "../../utils/elevation";
import { eOpenAddNotebookDialog } from "../../utils/events";
import { defaultBorderRadius, AppFontSize } from "../../utils/size";
import { Button } from "../ui/button";
import Seperator from "../ui/seperator";
import { SvgView } from "../ui/svg";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";

export type TStep = {
  text?: string;
  walkthroughItem: (colors: any) => React.ReactNode;
  title?: string;
  button?: {
    type: "next" | "done";
    title: string;
    action?: () => void;
  };
  actionButton?: {
    text: string;
    action: () => void;
  };
};

const NotebookWelcome = () => {
  const { colors } = useThemeColors();
  const data = useRotator([
    {
      title: strings.workAndOffice(),
      description: strings.workAndOfficeDesc(),
      count: 2
    },
    {
      title: strings.schoolWork(),
      description: strings.schoolWorkDesc(),
      count: 5
    },
    {
      title: strings.recipes(),
      description: strings.recipesDesc(),
      count: 10
    }
  ]);

  return (
    <View
      style={{
        width: "100%",
        padding: 12,
        backgroundColor: colors.secondary.background,
        borderRadius: 10,
        ...getContainerBorder(colors.secondary.background)
      }}
    >
      <View
        style={{
          padding: 12,
          width: "100%",
          backgroundColor: colors.primary.background,
          ...getElevationStyle(3),
          borderRadius: 10,
          marginVertical: 12
        }}
      >
        <Heading size={AppFontSize.md} color={colors.primary.heading}>
          {data?.title}
        </Heading>
        <Paragraph>{data?.description}</Paragraph>

        <Paragraph
          style={{
            marginTop: 5
          }}
          size={AppFontSize.xs}
          color={colors.secondary.paragraph}
        >
          {strings.dataTypesCamelCase.notebook()} - {data?.count}{" "}
          {strings.dataTypesPlural.note()}
        </Paragraph>
      </View>
    </View>
  );
};

const notebooks: { id: string; steps: TStep[] } = {
  id: "notebooks",
  steps: [
    {
      title: strings.notebooks(),
      text: strings.boostProductivityNotebook(),
      walkthroughItem: () => <NotebookWelcome />,
      button: {
        type: "next",
        title: strings.next()
      }
    },
    {
      title: strings.notebookNotes(),
      text: strings.notebookNotesDesc(),
      walkthroughItem: (colors: any) => (
        <View
          style={{
            width: "100%",
            padding: 12,
            backgroundColor: colors.secondary.background,
            borderRadius: 10,
            ...getContainerBorder(colors.secondary.background)
          }}
        >
          <View
            style={{
              padding: 12,
              width: "100%",
              backgroundColor: colors.primary.background,
              ...getElevationStyle(3),
              borderRadius: 10,
              marginVertical: 12
            }}
          >
            <Heading size={AppFontSize.md} color={colors.primary.heading}>
              {strings.workAndOffice()}
            </Heading>
            <Paragraph>{strings.workAndOfficeDesc()}</Paragraph>

            <Paragraph
              style={{
                marginTop: 5
              }}
              size={AppFontSize.xs}
              color={colors.secondary.paragraph}
            >
              {strings.notes(2)}
            </Paragraph>
          </View>
          <View
            style={{
              padding: 12,
              width: "90%",
              backgroundColor: colors.primary.background,
              borderRadius: 10,
              alignSelf: "flex-end",
              marginBottom: 10
            }}
          >
            <Paragraph color={colors.primary.accent}>
              <Icon
                color={colors.primary.accent}
                size={AppFontSize.sm}
                name="bookmark"
              />{" "}
              {strings.tasks()}
            </Paragraph>
          </View>
          <View
            style={{
              padding: 12,
              paddingVertical: 12,
              width: "80%",
              backgroundColor: colors.primary.background,
              borderRadius: defaultBorderRadius,
              alignSelf: "flex-end",
              marginBottom: 10
            }}
          >
            <Paragraph size={AppFontSize.xs}>
              <Icon
                color={colors.primary.icon}
                size={AppFontSize.sm}
                name="note"
              />{" "}
              {strings.taskAValue()}
            </Paragraph>
          </View>
          <View
            style={{
              padding: 12,
              width: "80%",
              backgroundColor: colors.primary.background,
              borderRadius: defaultBorderRadius,
              paddingVertical: 12,
              alignSelf: "flex-end",
              marginBottom: 10
            }}
          >
            <Paragraph size={AppFontSize.xs}>
              <Icon
                color={colors.primary.icon}
                size={AppFontSize.sm}
                name="note"
              />{" "}
              {strings.taskBValue()}
            </Paragraph>
          </View>
          <View
            style={{
              padding: 12,
              width: "90%",
              backgroundColor: colors.primary.background,
              borderRadius: 10,
              alignSelf: "flex-end",
              marginBottom: 10
            }}
          >
            <Paragraph color={colors.primary.accent}>
              <Icon
                color={colors.primary.accent}
                size={AppFontSize.sm}
                name="bookmark"
              />{" "}
              {strings.meetings()}
            </Paragraph>
          </View>
        </View>
      ),
      button: {
        type: "next",
        title: strings.next()
      }
    },
    {
      title: strings.easyAccess(),
      text: strings.easyAccessDesc(),
      walkthroughItem: () => (
        <View
          style={{
            paddingHorizontal: 20,
            paddingVertical: 12
          }}
        >
          {/* <PinItem
            isPlaceholder={true}
            item={
              {
                title: strings.tasks(),
                type: "notebook"
              } as Notebook
            }
            onPress={() => {}}
          />

          <PinItem
            isPlaceholder={true}
            item={
              {
                title: strings.workAndOffice(),
                type: "notebook"
              } as Notebook
            }
            onPress={() => {}}
          /> */}
        </View>
      ),
      button: {
        type: "done",
        title: strings.addFirstNotebook(),
        action: () => {
          eSendEvent(eOpenAddNotebookDialog);
        }
      }
    }
  ]
};

const trialstarted: { id: string; steps: TStep[] } = {
  id: "trialstarted",
  steps: [
    {
      title: strings.trialStarted(),
      text: strings.trialStartedDesc(),
      walkthroughItem: (colors) => (
        <SvgView src={LAUNCH_ROCKET(colors.primary.paragraph)} />
      ),
      button: {
        type: "next",
        title: strings.next()
      }
    },
    {
      title: strings.joinTheCause(),
      text: strings.meetPrivacyMinded(),
      walkthroughItem: (colors) => (
        <SvgView src={COMMUNITY_SVG(colors.primary.paragraph)} />
      ),
      button: {
        type: "done",
        title: strings.continue()
      },
      actionButton: {
        text: strings.joinDiscord(),
        action: () => {
          Linking.openURL("https://discord.gg/zQBK97EE22").catch(() => {
            /* empty */
          });
        }
      }
    }
  ]
};

const emailconfirmed: { id: string; steps: TStep[] } = {
  id: "emailconfirmed",
  steps: [
    {
      title: strings.emailConfirmed(),
      text: strings.emailNotConfirmedDesc(),
      walkthroughItem: (colors) => (
        <SvgView src={WELCOME_SVG(colors.primary.paragraph)} />
      ),
      button: {
        type: "done",
        title: strings.continue()
      }
    }
  ]
};

const Support = () => {
  return (
    <View
      style={{
        width: "100%",
        alignItems: "center"
      }}
    >
      <SvgView src={SUPPORT_SVG()} />
      <Heading>{strings.prioritySupport()}</Heading>
      <Paragraph
        style={{
          textAlign: "center"
        }}
        size={AppFontSize.md}
      >
        {strings.weAreAlwaysListening()}
      </Paragraph>
      <Seperator />

      <Button
        style={{
          justifyContent: "flex-start",
          marginBottom: 10,
          width: "90%"
        }}
        onPress={() => {
          Linking.openURL("https://discord.gg/zQBK97EE22").catch(() => {
            /* empty */
          });
        }}
        icon="discord"
        type="secondary"
        title={strings.joinDiscord()}
      />

      <Button
        style={{
          justifyContent: "flex-start",
          marginBottom: 10,
          width: "90%"
        }}
        onPress={() => {
          Linking.openURL("https://t.me/notesnook").catch(() => {
            /* empty */
          });
        }}
        icon="telegram"
        type="secondary"
        title={strings.joinTelegram()}
      />
      <Button
        style={{
          justifyContent: "flex-start",
          marginBottom: 10,
          width: "90%"
        }}
        icon="bug"
        type="secondary"
        title={strings.reportAnIssue()}
      />
      <Button
        style={{
          justifyContent: "flex-start",
          marginBottom: 10,
          width: "90%"
        }}
        icon="mail"
        type="secondary"
        title={strings.emailSupport()}
      />
    </View>
  );
};

const prouser: { id: string; steps: TStep[] } = {
  id: "prouser",
  steps: [
    {
      title: strings.welcomeToNotesnookPro(),
      text: strings.thankYouPrivacy(),
      walkthroughItem: (colors) => (
        <SvgView src={LAUNCH_ROCKET(colors.primary.paragraph)} />
      ),
      button: {
        type: "next",
        title: strings.next()
      }
    },
    {
      walkthroughItem: () => <Support />,
      button: {
        type: "done",
        title: strings.continue()
      }
    }
  ]
};

export default { notebooks, trialstarted, emailconfirmed, prouser };
