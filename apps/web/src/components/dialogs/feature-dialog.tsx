import { Text, Flex } from "rebass";
import Dialog from "./dialog";
import * as Icon from "../icons";
import { getHomeRoute, hardNavigate } from "../../navigation";
import { appVersion } from "../../utils/version";
import Config from "../../utils/config";
import { isTesting } from "../../utils/platform";

type CallToAction = {
  title: string;
  icon?: (props: any) => JSX.Element;
  action?: () => void;
};
type SubFeature = {
  title: string;
  icon?: (props: any) => JSX.Element;
  subtitle?: string | JSX.Element;
};
type Feature = {
  shouldShow?: () => boolean;
  title: string;
  subtitle?: string;
  cta: CallToAction;
  subFeatures?: SubFeature[];
};

type FeatureKeys = "confirmed" | "highlights";
const features: Record<FeatureKeys, Feature> = {
  confirmed: {
    title: "Email confirmed!",
    subtitle: "You can now sync your notes to unlimited devices.",
    cta: {
      title: "Continue",
      icon: Icon.ArrowRight,
      action: () => hardNavigate(getHomeRoute()),
    },
  },
  highlights: {
    title: "✨ Highlights ✨",
    subtitle: `Welcome to v${appVersion.clean}`,
    subFeatures: [
      {
        title: "Region-based pricing",
        subtitle: (
          <>
            You can now get Notesnook Pro at a much discounted price depending
            on where you are located. It works by default — no special codes
            required.
          </>
        ),
        icon: Icon.Pro,
      },
    ],
    cta: {
      title: "Got it",
      icon: Icon.Checkmark,
      action: () => {
        Config.set(`${appVersion.numerical}:highlights`, true);
      },
    },
    shouldShow: () => {
      const hasShown = Config.get(
        `${appVersion.numerical}:highlights`,
        false
      ) as boolean;
      return !isTesting() && !hasShown;
    },
  },
};

type FeatureDialogProps = {
  featureName: FeatureKeys;
  onClose: (result: boolean) => void;
};

function FeatureDialog(props: FeatureDialogProps) {
  const { featureName } = props;
  const feature = features[featureName];
  if (!feature || (feature.shouldShow && !feature.shouldShow())) {
    props.onClose(false);
    return null;
  }

  return (
    <Dialog
      isOpen={true}
      title={feature.title}
      description={feature.subtitle}
      alignment="center"
      positiveButton={{
        text: (
          <Flex>
            {feature.cta.icon && (
              <feature.cta.icon color="primary" size={16} sx={{ mr: 1 }} />
            )}
            {feature.cta.title}
          </Flex>
        ),
        onClick: () => {
          if (feature.cta.action) feature.cta.action();
          props.onClose(true);
        },
      }}
    >
      <Flex flexDirection="column" overflowY="auto" mt={2}>
        {feature.subFeatures?.map((feature) => (
          <Flex
            mb={2}
            bg="bgSecondary"
            p={2}
            sx={{ borderRadius: "default", ":hover": { bg: "hover" } }}
            flexDirection="column"
          >
            <Flex alignItems={"center"} justifyContent="start">
              {feature.icon && <feature.icon size={14} color="primary" />}
              <Text variant="subtitle" fontWeight="normal" ml={1}>
                {feature.title}
              </Text>
            </Flex>
            {feature.subtitle && (
              <Text variant="body" color="icon">
                {feature.subtitle}
              </Text>
            )}
          </Flex>
        ))}
      </Flex>
    </Dialog>
  );
}
export default FeatureDialog;

type CodeProps = { text: string; href?: string };
export function Code(props: CodeProps) {
  return (
    <Text
      as="code"
      sx={{
        bg: "background",
        color: "text",
        px: 1,
        borderRadius: 5,
        fontFamily: "monospace",
        fontSize: "subBody",
        border: "1px solid var(--border)",
        cursor: props.href ? "pointer" : "unset",
      }}
      onClick={() => {
        if (props.href) window.open(props.href, "_target");
      }}
    >
      {props.text}
    </Text>
  );
}
