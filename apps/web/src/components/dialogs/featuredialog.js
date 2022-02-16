import React from "react";
import { Text, Flex } from "rebass";
import Dialog from "./dialog";
import * as Icon from "../icons";
import { getHomeRoute, hardNavigate } from "../../navigation";

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
  welcome: {
    title: "Thank you for signing up!",
    subtitle: "Please confirm your email",

    subFeatures: [
      {
        title: "Unlimited notes & notebooks",
        icon: Icon.Note,
      },
      {
        title: "Unlimited file & image attachments",
        icon: Icon.Attachment,
      },
      {
        title: "Lock any note with a password",
        icon: Icon.Vault,
      },
      {
        title: "Automatic encrypted backups",
        icon: Icon.Backup,
      },
    ],
    help: {
      title: "What else is included in the free trial?",
      link: "https://notesnook.com/pricing",
    },
    cta: { title: "Start taking notes", icon: Icon.Write },
  },
  confirmed: {
    title: "Email confirmed!",
    subtitle: "",
    subFeatures: [
      {
        title: "Unlimited notes & notebooks",
        icon: Icon.Note,
      },
      {
        title: "Unlimited file & image attachments",
        icon: Icon.Attachment,
      },
      {
        title: "Lock any note with a password",
        icon: Icon.Vault,
      },
      {
        title: "Automatic encrypted backups",
        icon: Icon.Backup,
      },
    ],
    help: {
      title: "What else is included in the free trial?",
      link: "https://notesnook.com/pricing",
    },
    cta: {
      title: "Start taking notes",
      icon: Icon.Write,
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
        {feature.subFeatures.map((feature) => (
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
