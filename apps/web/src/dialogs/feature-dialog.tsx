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

import { useEffect } from "react";
import { ArrowRight, Checkmark, Icon, Warn } from "../components/icons";
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
  cta: CallToAction;
  subFeatures?: SubFeature[];
};

export type FeatureKeys = "confirmed" | "highlights";
const features: Record<FeatureKeys, Feature> = {
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
      ? "Welcome to Notesnook Beta!"
      : "✨ Highlights ✨",
    subtitle: appVersion.isBeta
      ? `v${appVersion.clean}-beta`
      : `Welcome to v${appVersion.clean}`,
    subFeatures: appVersion.isBeta
      ? [
          {
            icon: Warn,
            title: "Notice",
            subtitle: (
              <>
                This is the beta version and as such will contain bugs. Things
                are expected to break but should be generally stable. Please use
                the <Code text="Report an issue" /> button to report all bugs.
                Thank you!
              </>
            )
          },
          {
            icon: Warn,
            title: "Notice 2",
            subtitle: (
              <>
                Switching between beta &amp; stable versions can cause weird
                issues including data loss. It is recommended that you do not
                use both simultaneously. You can switch once the beta version
                enters stable.
              </>
            )
          }
        ]
      : [
          {
            title: "Notesnook Gift Cards",
            subtitle:
              "You can now gift Notesnook Pro to your friends and family. Gift cards are available in 1, 3, and 5-year plans at https://notesnook.com/giftcards."
          },
          {
            title: "Sorted search results",
            subtitle:
              "Search results are now sorted by date created by default."
          }
        ],
    cta: {
      title: strings.gotIt(),
      icon: Checkmark,
      action: () => {
        Config.set(`${appVersion.numerical}:highlights`, true);
      }
    },
    shouldShow: () => {
      if (!features.highlights.subFeatures?.length) return false;

      const key = `${appVersion.numerical}:highlights`;
      const hasShownBefore = Config.get(key, false) as boolean;
      const hasShownAny =
        appVersion.isBeta || Config.has((k) => k.endsWith(":highlights"));
      if (!hasShownAny) Config.set(key, true);

      return hasShownAny && !IS_TESTING && !hasShownBefore;
    }
  }
};

type FeatureDialogProps = BaseDialogProps<boolean> & {
  featureName: FeatureKeys;
};

export const FeatureDialog = DialogManager.register(function FeatureDialog(
  props: FeatureDialogProps
) {
  const { featureName, onClose } = props;
  const feature = features[featureName];

  useEffect(() => {
    if (!feature || (feature.shouldShow && !feature.shouldShow())) {
      onClose(false);
    }
  }, [feature, onClose]);

  return (
    <Dialog
      isOpen={true}
      title={feature.title}
      description={feature.subtitle}
      textAlignment="center"
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
              <Text variant="subtitle" ml={1} sx={{ fontWeight: "normal" }}>
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
