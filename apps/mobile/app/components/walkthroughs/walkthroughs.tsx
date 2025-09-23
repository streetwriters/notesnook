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
import { DefaultAppStyles } from "../../utils/styles";
import { useUserStore } from "../../stores/use-user-store";
import { planToId, SubscriptionPlan } from "@notesnook/core";
import { planToDisplayName } from "../../utils/constants";
import AppIcon from "../ui/AppIcon";

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

const emailconfirmed: () => { id: string; steps: TStep[] } = () => ({
  id: "emailconfirmed",
  steps: [
    {
      title: strings.emailConfirmed(),
      text: strings.emailConfirmedDesc(),
      walkthroughItem: (colors) => (
        <SvgView src={WELCOME_SVG(colors.primary.paragraph)} />
      ),
      button: {
        type: "done",
        title: strings.continue()
      }
    }
  ]
});

const prouser: () => { id: string; steps: TStep[] } = () => {
  return {
    id: "prouser",
    steps: [
      {
        title: strings.welcomeToPlan(
          planToDisplayName(
            useUserStore.getState().user?.subscription?.plan as SubscriptionPlan
          )
        ),
        text: strings.thankYouPrivacy(),
        walkthroughItem: (colors) => (
          <AppIcon name="check" color={colors.primary.accent} size={50} />
        ),
        button: {
          type: "done",
          title: strings.continue()
        }
      }
    ]
  };
};

export default { emailconfirmed, prouser };
