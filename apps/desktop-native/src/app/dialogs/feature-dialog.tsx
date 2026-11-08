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

import { Dialog, Flex, Text } from "@ui";
import { environment, shell } from "@platform";
import { getHomeRoute, hardNavigate } from "../navigation";
import { appVersion } from "../utils/version";
import Config from "../utils/config";
import { ArrowRight, Checkmark, Icon, Warn } from "../components/icons";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import { strings } from "@notesnook/intl";
import type { ReactNode } from "react";

type CallToAction = {
  title: string;
  icon?: Icon;
  action?: () => void;
};
type SubFeature = {
  title: string;
  icon?: Icon;
  subtitle?: ReactNode;
};
type Feature = {
  shouldShow?: () => boolean;
  title: string;
  subtitle?: string;
  cta: CallToAction;
  subFeatures?: SubFeature[];
};

export type FeatureKeys = "confirmed" | "highlights";
function getFeatures(): Record<FeatureKeys, Feature> {
  return {
    confirmed: {
      title: strings.emailConfirmed(),
      subtitle: strings.confirmEmailThankyou(),
      cta: {
        title: strings.continue(),
        icon: ArrowRight,
        action: () => hardNavigate(getHomeRoute())
      }
    },
    highlights: {
      title: appVersion.isBeta
        ? strings.welcomeToNotesnookBeta()
        : strings.highlightsWithStars(),
      subtitle: appVersion.isBeta
        ? `v${appVersion.clean}-beta`
        : strings.welcomeToVersion(appVersion.clean),
      subFeatures: appVersion.isBeta
        ? [
            {
              icon: Warn,
              title: strings.notice(),
              subtitle: (
                <>
                  {strings.betaWarningDescription[0]()}{" "}
                  <Code text={strings.reportAnIssue()} />{" "}
                  {strings.betaWarningDescription[1]()}
                </>
              )
            },
            {
              icon: Warn,
              title: strings.notice2(),
              subtitle: strings.betaSwitchingWarning()
            }
          ]
        : [],
      cta: {
        title: strings.gotIt(),
        icon: Checkmark,
        action: () => {
          Config.set(`${appVersion.numerical}:highlights`, true);
        }
      },
      shouldShow: () => {
        if (!appVersion.isBeta) return false;

        const key = `${appVersion.numerical}:highlights`;
        const hasShownBefore = Config.get(key, false) as boolean;
        const hasShownAny = appVersion.isBeta;
        if (!hasShownAny) Config.set(key, true);

        return hasShownAny && !environment.isTesting && !hasShownBefore;
      }
    }
  };
}

type FeatureDialogProps = BaseDialogProps<boolean> & {
  featureName: FeatureKeys;
};

export const FeatureDialog = DialogManager.register(function FeatureDialog(
  props: FeatureDialogProps
) {
  const { featureName, onClose } = props;
  const features = getFeatures();
  const feature = features[featureName];
  const isShown = feature && feature.shouldShow && feature.shouldShow();

  return (
    <Dialog
      isOpen={true}
      title={feature.title}
      description={feature.subtitle}
      textAlignment="center"
      onOpen={() => {
        if (!isShown) onClose(false);
      }}
      positiveButton={{
        text: (
          <Flex sx={{ flexDirection: "row", alignItems: "center" }}>
            {feature.cta.icon && <feature.cta.icon color="accent" size={16} />}
            <Text sx={{ ml: 1 }}>{feature.cta.title}</Text>
          </Flex>
        ),
        onClick: () => {
          if (feature.cta.action) feature.cta.action();
          props.onClose(true);
        }
      }}
    >
      <Flex sx={{ mt: 2, flexDirection: "column" }}>
        {feature.subFeatures?.map((feature) => (
          <Flex
            key={feature.title}
            sx={{
              mb: 2,
              bg: "background-secondary",
              p: 2,
              borderRadius: "default",
              ":hover": { bg: "hover" },
              flexDirection: "column"
            }}
          >
            <Flex
              sx={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "flex-start"
              }}
            >
              {feature.icon && <feature.icon size={14} color="accent" />}
              <Text
                variant="subtitle"
                sx={{ ml: feature.icon ? 1 : 0, fontWeight: "normal" }}
              >
                {feature.title}
              </Text>
            </Flex>
            {feature.subtitle && (
              <Text variant="subBody" sx={{ fontSize: "body" }}>
                {feature.subtitle}
              </Text>
            )}
          </Flex>
        ))}
      </Flex>
    </Dialog>
  );
});

type CodeProps = { text: string; href?: string };
export function Code(props: CodeProps) {
  return (
    <Text
      onPress={() => {
        if (props.href) shell.openUrl(props.href);
      }}
      sx={{
        bg: "background",
        color: "paragraph",
        px: 1,
        borderRadius: 5,
        fontFamily: "monospace",
        fontSize: "subBody",
        border: "1px solid",
        borderColor: "border",
        cursor: props.href ? "pointer" : "default"
      }}
    >
      {props.text}
    </Text>
  );
}
