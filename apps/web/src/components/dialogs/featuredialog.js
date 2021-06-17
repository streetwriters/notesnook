import React from "react";
import { Text, Flex, Button } from "rebass";
import Dialog from "./dialog";
import * as Icon from "../icons";
import Config from "../../utils/config";

const features = {
  monographs: {
    title: "Introducing Monographs",
    subtitle: "A simple & secure way to share your notes.",
    help: {
      title: "What is a monograph & how it works?",
      link: "https://docs.notesnook.com/monographs",
    },
    cta: { title: "Start publishing", icon: Icon.Rocket },
    subFeatures: [
      {
        title: "Publish unlimited notes for free",
        subtitle: "Publish any note you want. Completely free. No limits.",
        icon: Icon.Publish,
      },
      {
        title: "Share a note with anyone in the world",
        subtitle:
          "It just takes 2 taps to publish a note to a public URL and anyone with the link can view it.",
        icon: Icon.Share,
      },
      {
        title: "Put a password to make it private",
        subtitle:
          "Turn on password protection so only people with the password can unlock and view it.",
        icon: Icon.Password,
      },
      {
        title: "Self destruct for one time notes",
        subtitle:
          "Share one-time sensitive notes with self destruct on; the note will be destroyed after the first person views it.",
        icon: Icon.Destruct,
      },
    ],
  },
};

function FeatureDialog(props) {
  const { featureName } = props;
  const feature = features[featureName];
  if (!feature) return;
  return (
    <Dialog
      isOpen={true}
      // showClose
      headerPaddingBottom={"0px"}
    >
      <Flex flexDirection="column" flex={1} overflowY="hidden">
        <Flex sx={{ position: "relative" }} alignSelf="center">
          <Text variant="heading" textAlign="center" fontSize="28px">
            {feature.title}
            <Text
              variant="subBody"
              textAlign="center"
              fontWeight="normal"
              fontSize="title"
            >
              {feature.subtitle}
            </Text>
          </Text>
        </Flex>
        <Flex flexDirection="column" py={2} overflowY="auto">
          {feature.subFeatures.map((feature) => (
            <Flex my={2}>
              <feature.icon size={28} color="primary" />
              <Text variant="title" fontWeight="normal" ml={2} flex={1}>
                {feature.title}
                <Text variant="body" color="fontTertiary">
                  {feature.subtitle}
                </Text>
              </Text>
            </Flex>
          ))}
        </Flex>
        <Flex pb={2}>
          <Text as="a" href={feature.help.link} target="_blank" variant="body">
            {feature.help.title}
          </Text>
        </Flex>
        <Button
          display="flex"
          fontSize="title"
          fontWeight="bold"
          alignSelf="center"
          mt={2}
          onClick={() => {
            Config.set(`feature:${featureName}`, true);
            props.onClose(true);
          }}
        >
          <feature.cta.icon color="static" size={18} sx={{ mr: 1 }} />
          {feature.cta.title}
        </Button>
      </Flex>
    </Dialog>
  );
}
export default FeatureDialog;
