import React from "react";
import { Text, Flex, Button } from "rebass";
import Dialog from "./dialog";
import * as Icon from "../icons";
import { useStore as useUserStore } from "../../stores/user-store";
import { useStore as useThemeStore } from "../../stores/theme-store";
import { upgrade } from "../../common/checkout";
import { showSignUpDialog } from "../../common/dialog-controller";
import { ReactComponent as Personalization } from "../../assets/accent.svg";
import { ReactComponent as Backups } from "../../assets/backup.svg";
import { ReactComponent as Export } from "../../assets/export.svg";
import { ReactComponent as Organize } from "../../assets/organize.svg";
import { ReactComponent as RichText } from "../../assets/richtext.svg";
import { ReactComponent as Sync } from "../../assets/sync.svg";
import { ReactComponent as Vault } from "../../assets/vault.svg";
import "react-responsive-carousel/lib/styles/carousel.min.css"; // requires a loader
import { changeSvgTheme } from "../../utils/css";

const premiumDetails = [
  {
    title: "Unlimited attachments",
    description: "Your notes will be automatically synced to all your devices.",
    illustration: {
      icon: Sync,
      width: "40%",
    },
  },
  {
    title: "Unlimited storage",
    description: "Your notes will be automatically synced to all your devices.",
    illustration: {
      icon: Sync,
      width: "40%",
    },
  },
  {
    title: "Unlimited notebooks & tags",
    description:
      "Make unlimited notebooks and tags, and assign colors to your notes for quick access.",
    illustration: {
      icon: Organize,
      width: "40%",
    },
  },
  {
    title: "Automatic syncing",
    description: "Your notes will be automatically synced to all your devices.",
    illustration: {
      icon: Sync,
      width: "40%",
    },
  },
  {
    title: "Secure vault for notes",
    description:
      "Lock any note with a password and keep sensitive data under lock and key.",
    illustration: {
      icon: Vault,
      width: "35%",
    },
  },
  {
    title: "Full rich text editor + markdown support",
    description:
      "Add images, links, tables and lists to your notes, and use markdown for fast editing.",
    illustration: {
      icon: RichText,
      width: "50%",
    },
  },
  {
    title: "Multi-format exports",
    description: "Export your notes in PDF, Markdown, or HTML formats.",
    illustration: {
      icon: Export,
      width: "25%",
    },
  },
  {
    title: "Automatic encrypted backups",
    description: "Enable daily or weekly backups with automatic encryption.",
    illustration: {
      icon: Backups,
      width: "25%",
    },
  },
  {
    title: "Customize Notesnook",
    description: "Change app colors and turn on automatic theme switching.",
    illustration: {
      icon: Personalization,
      width: "50%",
    },
  },
  {
    title: (
      <>
        Special Pro badge on{" "}
        <a href="https://discord.gg/5davZnhw3V">our Discord server</a>
      </>
    ),
    description:
      "Pro users get access to special channels and priority support on our Discord server.",
    illustration: {
      icon: Personalization,
      width: "50%",
    },
  },
];

function BuyDialog(props) {
  const isLoggedIn = useUserStore((store) => store.isLoggedIn);
  const user = useUserStore((store) => store.user);
  const accent = useThemeStore((store) => store.accent);

  return (
    <Dialog
      isOpen={true}
      // showClose
      onClose={props.onCancel}
      onOpen={() => changeSvgTheme(accent)}
      padding={"0px"}
      margin={"0px"}
      headerPaddingBottom={"0px"}
    >
      <Flex flexDirection="column" flex={1} overflowY="hidden">
        <Flex bg="primary" p={5} sx={{ position: "relative" }}>
          <Text variant="heading" fontSize="38px" color="static">
            Notesnook Pro
            <Text
              variant="subBody"
              color="static"
              opacity={1}
              fontWeight="normal"
              fontSize="title"
            >
              Ready to take the next step on your private note taking journey?
            </Text>
          </Text>
          <Text
            sx={{ position: "absolute", top: 0, right: 0 }}
            variant="heading"
            color="static"
            opacity={0.2}
            fontSize={90}
          >
            $4.49
          </Text>
        </Flex>
        <Flex
          flexDirection="column"
          px={5}
          pb={2}
          overflowY="auto"
          sx={{ position: "relative" }}
        >
          {premiumDetails.map((item) => (
            <Flex mt={2}>
              <Icon.Checkmark color="primary" size={16} />
              <Text variant="body" fontSize="title" ml={1}>
                {item.title}
              </Text>
            </Flex>
          ))}
        </Flex>
        <Flex flexDirection="column" bg="shade" p={5} pt={2}>
          <Text variant="heading" fontSize={32} color="primary">
            Only for $4.49/mo
          </Text>
          <Text variant="subBody" color="text" my={1}>
            {isLoggedIn
              ? "Cancel anytime. No questions asked."
              : "Start your 14 days free trial (no credit card required)"}
          </Text>
          <Button
            fontSize="title"
            fontWeight="bold"
            onClick={async () => {
              if (isLoggedIn) {
                await upgrade(user);
              } else {
                await showSignUpDialog();
              }
              props.onCancel();
            }}
          >
            Subscribe to Notesnook Pro
          </Button>
        </Flex>
      </Flex>
    </Dialog>
  );
}
export default BuyDialog;
