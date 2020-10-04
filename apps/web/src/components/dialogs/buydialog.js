import React from "react";
import { Text, Flex, Button } from "rebass";
import Dialog, { showDialog } from "./dialog";
import * as Icon from "../icons";
import { useStore as useUserStore } from "../../stores/user-store";
import { upgrade } from "../../common/upgrade";
import { showSignUpDialog } from "./signupdialog";

const premiumDetails = [
  {
    title: "Cross Platfrom Sync",
    description:
      "Securely sync your notes on any device, Android, iOS, Windows, MacOS, Linux and Web!",
  },
  {
    title: "Zero Knowledge",
    description:
      "No sneaking, no stealing. We give all the keys for your data to you. Privacy is not just a word to us. We use industry-grade XChaChaPoly1305 and Argon2 which is miles ahead other solutions making sure your data is secure and private even a million years from now.",
  },
  {
    title: "Organize Notes Like Never Before",
    description:
      "Organize your notes using notebooks, tags and colors. Add notes to favorites for quick access. Pin most important notes and notebooks on top for quick access. You can also pin notes and notebooks to quickly access them!",
  },
  {
    title: "Full Rich Text Editor with Markdown",
    description:
      "Unleash the power of a complete Rich Text Editor in your notes app. You can add images, links and even embed videos! We have even added full markdown support too!",
  },
  {
    title: "Export Notes",
    description:
      "You can export your notes as PDF, Markdown, Plain text or HTML file.",
  },
  {
    title: "Backup and Restore",
    description:
      "Backup and restore your notes anytime into your phone storage. You can encrypt all your backups if required!",
  },
];

function BuyDialog(props) {
  const isLoggedIn = useUserStore((store) => store.isLoggedIn);
  const user = useUserStore((store) => store.user);

  return (
    <Dialog
      isOpen={true}
      title="Notesnook Pro"
      onClose={props.onCancel}
      showClose
    >
      <Flex flexDirection="column" flex={1} sx={{ overflow: "hidden" }}>
        <Flex flexDirection="column" sx={{ overflowY: "scroll" }}>
          {premiumDetails.map((detail) => (
            <Flex mb={1}>
              <Icon.CheckCircle
                size={20}
                color="primary"
                sx={{ flexShrink: 0, mr: 2 }}
              />
              <Text variant="body">
                {detail.title}
                <Text variant="subBody">{detail.description}</Text>
              </Text>
            </Flex>
          ))}
        </Flex>
        <Flex
          flex={1}
          flexDirection="column"
          pt={2}
          sx={{
            borderRadius: "default",
          }}
        >
          <Text variant="title" color="primary">
            {isLoggedIn ? "Upgrade now" : "Try it Now"}
            <Text variant="subBody" color="text">
              {isLoggedIn
                ? "Cancel anytime. No questions asked."
                : "Start your 14 Day Trial (no credit card required)"}
            </Text>
          </Text>
          <Text as="span" variant="body" fontSize="heading" color="text" mt={3}>
            $6.99
            <Text as="span" variant="body" color="primary" fontSize="subBody">
              /mo
            </Text>
          </Text>
          <Button
            mt={1}
            fontSize="body"
            onClick={async () => {
              props.onCancel();
              if (isLoggedIn) {
                await upgrade(user);
              } else {
                await showSignUpDialog();
              }
            }}
          >
            {isLoggedIn ? "Subscribe to Notesnook Pro" : "Sign up now"}
          </Button>
        </Flex>
      </Flex>
    </Dialog>
  );
}

export function showBuyDialog() {
  return showDialog((perform) => <BuyDialog onCancel={() => perform(false)} />);
}
