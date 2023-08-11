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

import React from "react";
import { Linking, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import {
  COMMUNITY_SVG,
  LAUNCH_ROCKET,
  SUPPORT_SVG,
  WELCOME_SVG
} from "../../assets/images/assets";
import { ThemeStore } from "../../stores/use-theme-store";
import { eSendEvent } from "../../services/event-manager";
import { getElevationStyle } from "../../utils/elevation";
import { eOpenAddNotebookDialog } from "../../utils/events";
import { SIZE } from "../../utils/size";
import useRotator from "../../hooks/use-rotator";
import { AccentColorPicker } from "../../screens/settings/appearance";
import { Button } from "../ui/button";
import { SvgView } from "../ui/svg";
import { PinItem } from "../side-menu/pinned-section";
import Seperator from "../ui/seperator";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
import { useThemeColors } from "@notesnook/theme";

export type TStep = {
  text?: string;
  walkthroughItem: (colors: ThemeStore["colors"]) => React.ReactNode;
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
      title: "Work and office",
      description: "Everything related to my job",
      count: 2
    },
    {
      title: "School work",
      description: "I don't like doing this but I have to.",
      count: 5
    },
    {
      title: "Recipes",
      description: "I love cooking and collecting recipes",
      count: 10
    }
  ]);

  return (
    <View
      style={{
        width: "100%",
        padding: 12,
        backgroundColor: colors.secondary.background,
        borderRadius: 10
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
        <Heading size={SIZE.md} color={colors.primary.heading}>
          {data?.title}
        </Heading>
        <Paragraph>{data?.description}</Paragraph>

        <Paragraph
          style={{
            marginTop: 5
          }}
          size={SIZE.xs}
          color={colors.secondary.paragraph}
        >
          Notebook - {data?.count} notes
        </Paragraph>
      </View>
    </View>
  );
};

const notebooks: { id: string; steps: TStep[] } = {
  id: "notebooks",
  steps: [
    {
      title: "Notebooks",
      text: "Boost your productivity with Notebooks and organize your notes.",
      walkthroughItem: () => <NotebookWelcome />,
      button: {
        type: "next",
        title: "Next"
      }
    },
    {
      title: "Notebook > Topic > Notes",
      text: "Every Notebook has various topics which are like sections that hold all your notes.",
      walkthroughItem: (colors: ThemeStore["colors"]) => (
        <View
          style={{
            width: "100%",
            padding: 12,
            backgroundColor: colors.secondary.background,
            borderRadius: 10
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
            <Heading size={SIZE.md} color={colors.primary.heading}>
              Work and office
            </Heading>
            <Paragraph>Everything related to my job in one place.</Paragraph>

            <Paragraph
              style={{
                marginTop: 5
              }}
              size={SIZE.xs}
              color={colors.secondary.paragraph}
            >
              Notebook - 2 notes
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
                size={SIZE.sm}
                name="bookmark"
              />{" "}
              Tasks
            </Paragraph>
          </View>
          <View
            style={{
              padding: 12,
              paddingVertical: 12,
              width: "80%",
              backgroundColor: colors.primary.background,
              borderRadius: 5,
              alignSelf: "flex-end",
              marginBottom: 10
            }}
          >
            <Paragraph size={SIZE.xs}>
              <Icon color={colors.primary.icon} size={SIZE.sm} name="note" />{" "}
              February 2022 Week 2
            </Paragraph>
          </View>
          <View
            style={{
              padding: 12,
              width: "80%",
              backgroundColor: colors.primary.background,
              borderRadius: 5,
              paddingVertical: 12,
              alignSelf: "flex-end",
              marginBottom: 10
            }}
          >
            <Paragraph size={SIZE.xs}>
              <Icon color={colors.primary.icon} size={SIZE.sm} name="note" />{" "}
              February 2022 Week 1
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
                size={SIZE.sm}
                name="bookmark"
              />{" "}
              Meetings
            </Paragraph>
          </View>
        </View>
      ),
      button: {
        type: "next",
        title: "Next"
      }
    },
    {
      title: "Easy access",
      text: "You can create shortcuts of frequently accessed notebooks or topics in Side Menu",
      walkthroughItem: () => (
        <View
          style={{
            paddingHorizontal: 20,
            paddingVertical: 12
          }}
        >
          <PinItem
            index={0}
            placeholder={true}
            item={{
              title: "Tasks",
              type: "topic"
            }}
            onPress={() => { }}
          />

          <PinItem
            index={1}
            placeholder={true}
            item={{
              title: "Work and office",
              type: "notebook"
            }}
            onPress={() => { }}
          />
        </View>
      ),
      button: {
        type: "done",
        title: "Add your first notebook",
        action: () => {
          eSendEvent(eOpenAddNotebookDialog);
        }
      }
    }
  ]
};

const ChooseTheme = () => {
  return (
    <View
      style={{
        alignItems: "center",
        marginTop: 20
      }}
    >
      <Heading>Make yourself at home</Heading>

      <Paragraph
        style={{
          textAlign: "center",
          alignSelf: "center",
          maxWidth: "80%"
        }}
        size={SIZE.md}
      >
        Pick a theme of your choice
      </Paragraph>
      <Seperator />
      <AccentColorPicker />
      <Seperator />
    </View>
  );
};

const trialstarted: { id: string; steps: TStep[] } = {
  id: "trialstarted",
  steps: [
    {
      title: "Your trial is activated",
      text: "You can use all premium features for free for the next 14 days",
      walkthroughItem: (colors) => (
        <SvgView src={LAUNCH_ROCKET(colors.primary.paragraph)} />
      ),
      button: {
        type: "next",
        title: "Next"
      }
    },

    {
      walkthroughItem: () => <ChooseTheme />,
      button: {
        type: "next",
        title: "Next"
      }
    },
    {
      title: "Join the cause",
      text: "Meet other privacy-minded people and talk to us directly about your concerns, issues and suggestions.",
      walkthroughItem: (colors) => (
        <SvgView src={COMMUNITY_SVG(colors.primary.paragraph)} />
      ),
      button: {
        type: "done",
        title: "Continue"
      },
      actionButton: {
        text: "Join Discord Community",
        action: () => {
          Linking.openURL("https://discord.gg/zQBK97EE22").catch(console.log);
        }
      }
    }
  ]
};

const emailconfirmed: { id: string; steps: TStep[] } = {
  id: "emailconfirmed",
  steps: [
    {
      title: "Email confirmed",
      text: "Your email was confirmed successfully. Thank you for choosing end-to-end encrypted note taking.",
      walkthroughItem: (colors) => (
        <SvgView src={WELCOME_SVG(colors.primary.paragraph)} />
      ),
      button: {
        type: "done",
        title: "Continue"
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
      <Heading>Get Priority Support</Heading>
      <Paragraph
        style={{
          textAlign: "center"
        }}
        size={SIZE.md}
      >
        You can reach out to us via multiple channels if you face an issue or
        want to just talk.
      </Paragraph>
      <Seperator />

      <Button
        style={{
          justifyContent: "flex-start",
          marginBottom: 10,
          width: "90%"
        }}
        onPress={() => {
          Linking.openURL("https://discord.gg/zQBK97EE22").catch(console.log);
        }}
        icon="discord"
        type="grayBg"
        title="Join our community on Discord"
      />

      <Button
        style={{
          justifyContent: "flex-start",
          marginBottom: 10,
          width: "90%"
        }}
        onPress={() => {
          Linking.openURL("https://t.me/notesnook").catch(console.log);
        }}
        icon="telegram"
        type="grayBg"
        title="Join our Telegram group"
      />
      <Button
        style={{
          justifyContent: "flex-start",
          marginBottom: 10,
          width: "90%"
        }}
        icon="bug"
        type="grayBg"
        title="Submit an issue from Settings"
      />
      <Button
        style={{
          justifyContent: "flex-start",
          marginBottom: 10,
          width: "90%"
        }}
        icon="mail"
        type="grayBg"
        title="Email us at support@streetwriters.co"
      />
    </View>
  );
};

const prouser: { id: string; steps: TStep[] } = {
  id: "prouser",
  steps: [
    {
      title: "Welcome to Notesnook Pro",
      text: "Thank you for reaffirming our idea that privacy comes first",
      walkthroughItem: (colors) => (
        <SvgView src={LAUNCH_ROCKET(colors.primary.paragraph)} />
      ),
      button: {
        type: "next",
        title: "Next"
      }
    },
    {
      walkthroughItem: () => <Support />,
      button: {
        type: "done",
        title: "Continue"
      }
    }
  ]
};

export default { notebooks, trialstarted, emailconfirmed, prouser };
