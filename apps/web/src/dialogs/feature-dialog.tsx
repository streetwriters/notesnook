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

import { Text, Flex } from "@theme-ui/components";
import Dialog from "../components/dialog";
import { getHomeRoute, hardNavigate } from "../navigation";
import { appVersion } from "../utils/version";
import Config from "../utils/config";
import { ArrowRight, Icon } from "../components/icons";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import { strings } from "@notesnook/intl";

type CallToAction = {
  title: string;
  icon?: Icon;
  action?: () => void;
};
type SubFeature = {
  title: string;
  icon?: Icon;
  subtitle?: string | JSX.Element;
};
type Feature = {
  shouldShow?: () => boolean;
  title: string;
  subtitle?: string;
  message?: string;
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
        ? undefined
        : strings.welcomeToVersion(appVersion.clean),
      message: appVersion.isBeta
        ? "Thank you for joining the Beta program. Beta versions get new features first, but they may be less stable and can have bugs.\n\nIf you run into any issues, please report them so we can fix them before the stable release. You can switch back to Stable anytime from Settings > About."
        : undefined,
      cta: {
        title: strings.gotIt(),
        action: () => {
          Config.set(`${appVersion.numerical}:highlights`, true);
        }
      },
      shouldShow: () => {
        if (!appVersion.isBeta) return false;

        const key = `${appVersion.numerical}:highlights`;
        const hasShownBefore = Config.get(key, false) as boolean;
        const hasShownAny =
          appVersion.isBeta || Config.has((k) => k.endsWith(":highlights"));
        if (!hasShownAny) Config.set(key, true);

        return hasShownAny && !IS_TESTING && !hasShownBefore;
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
      textAlignment={feature.message ? "left" : "center"}
      onOpen={() => {
        if (!isShown) onClose(false);
      }}
      positiveButton={{
        text: (
          <Flex>
            {feature.cta.icon && (
              <feature.cta.icon color="accent" size={16} sx={{ mr: 1 }} />
            )}
            {feature.cta.title}
          </Flex>
        ),
        onClick: () => {
          if (feature.cta.action) feature.cta.action();
          props.onClose(true);
        }
      }}
    >
      {feature.message ? (
        <Text
          variant="body"
          sx={{
            display: "block",
            mt: "spacing4",
            mb: "spacing7",
            color: "paragraph",
            fontSize: "md",
            fontWeight: 400,
            lineHeight: 1.4,
            whiteSpace: "pre-line"
          }}
        >
          {feature.message}
        </Text>
      ) : null}
      <Flex mt={2} sx={{ flexDirection: "column", overflowY: "auto" }}>
        {feature.subFeatures?.map((feature) => (
          <Flex
            key={feature.title}
            mb={2}
            bg="var(--background-secondary)"
            p={2}
            sx={{
              borderRadius: "default",
              ":hover": { bg: "hover" },
              flexDirection: "column"
            }}
          >
            <Flex sx={{ alignItems: "center", justifyContent: "start" }}>
              {feature.icon && <feature.icon size={14} color="accent" />}
              <Text
                variant="subtitle"
                ml={feature.icon ? 1 : 0}
                sx={{ fontWeight: "normal" }}
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
      as="code"
      sx={{
        bg: "background",
        color: "paragraph",
        px: 1,
        borderRadius: 5,
        fontFamily: "monospace",
        fontSize: "subBody",
        border: "1px solid var(--border)",
        cursor: props.href ? "pointer" : "unset"
      }}
      onClick={() => {
        if (props.href) window.open(props.href, "_target");
      }}
    >
      {props.text}
    </Text>
  );
}
