import React from "react";
import { Text, Flex } from "rebass";
import Dialog from "./dialog";
import * as Icon from "../icons";
import { getHomeRoute, hardNavigate } from "../../navigation";

const features = {
  confirmed: {
    title: "Email confirmed!",
    subtitle: "You can now sync your notes to unlimited devices.",
    cta: {
      title: "Continue",
      icon: Icon.ArrowRight,
      action: () => hardNavigate(getHomeRoute()),
    },
  },
};

function FeatureDialog(props) {
  const { featureName } = props;
  const feature = features[featureName];
  if (!feature) return;
  return (
    <Dialog
      isOpen={true}
      title={feature.title}
      description={feature.subtitle}
      buttonsAlignment="center"
      positiveButton={{
        text: (
          <Flex>
            <feature.cta.icon color="primary" size={16} sx={{ mr: 1 }} />
            {feature.cta.title}
          </Flex>
        ),
        onClick: () => {
          if (feature.cta.action) feature.cta.action();
          props.onClose(true);
        },
      }}
    >
      <Flex flexDirection="column" overflowY="auto">
        {feature.subFeatures?.map((feature) => (
          <Flex
            my={feature.subtitle ? 2 : 1}
            bg="bgSecondary"
            p={1}
            sx={{ borderRadius: "default" }}
          >
            <feature.icon size={18} color="primary" />
            <Text variant="subtitle" fontWeight="normal" ml={2} flex={1}>
              {feature.title}
              {feature.subtitle && (
                <Text variant="body" color="fontTertiary">
                  {feature.subtitle}
                </Text>
              )}
            </Text>
          </Flex>
        ))}
      </Flex>
      {feature.help && (
        <Text
          as="a"
          mt={1}
          href={feature.help.link}
          target="_blank"
          variant="body"
        >
          {feature.help.title}
        </Text>
      )}
    </Dialog>
  );
}
export default FeatureDialog;
