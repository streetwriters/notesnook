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
import { Carousel } from "react-responsive-carousel";
import { changeSvgTheme } from "../../utils/css";

const premiumDetails = [
  {
    title: "Automatic syncing",
    description: "Your notes will be automatically synced to all your devices.",
    illustration: {
      icon: Sync,
      width: "40%",
    },
  },
  {
    title: "Unlimited organization",
    description:
      "Make unlimited notebooks and tags, and assign colors to your notes for quick access.",
    illustration: {
      icon: Organize,
      width: "40%",
    },
  },
  {
    title: "Secure vault",
    description:
      "Lock any note with a password and keep sensitive data under lock and key.",
    illustration: {
      icon: Vault,
      width: "35%",
    },
  },
  {
    title: "Full rich text editor",
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
    title: "Automatic & encrypted backups",
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
    title: "Get the pro badge on Discord",
    description:
      "Pro users get access to special channels and priority support on our Discord server.",
    illustration: {
      icon: Personalization,
      width: "50%",
    },
  },
];

function BuyDialog(props) {
  const { initialIndex } = props;
  const isLoggedIn = useUserStore((store) => store.isLoggedIn);
  const user = useUserStore((store) => store.user);
  const accent = useThemeStore((store) => store.accent);

  return (
    <Dialog
      isOpen={true}
      showClose
      onClose={props.onCancel}
      scrollable
      onOpen={() => changeSvgTheme(accent)}
    >
      <Flex flexDirection="column" flex={1}>
        <Carousel
          infiniteLoop
          autoPlay
          showStatus={false}
          swipeable
          emulateTouch
          showArrows
          useKeyboardArrows
          interval={5000}
          stopOnHover
          selectedItem={initialIndex}
          showThumbs={false}
          showIndicators={false}
          renderArrowNext={(click, hasNext) => (
            <Button
              variant="icon"
              disabled={!hasNext}
              onClick={click}
              sx={{ alignSelf: "center" }}
            >
              <Icon.ArrowRight
                color={hasNext ? "text" : "grey"}
                sx={{
                  ":hover": {
                    color: "primary",
                  },
                }}
              />
            </Button>
          )}
          renderArrowPrev={(click, hasPrev) => (
            <Button
              variant="icon"
              disabled={!hasPrev}
              sx={{ alignSelf: "center" }}
              onClick={click}
            >
              <Icon.ArrowLeft
                color={hasPrev ? "text" : "grey"}
                sx={{
                  ":hover": {
                    color: "primary",
                  },
                }}
              />
            </Button>
          )}
        >
          {premiumDetails.map((item) => (
            <Flex
              flexDirection="column"
              justifyContent="center"
              alignItems="center"
              width="100%"
              height="100%"
            >
              <item.illustration.icon height={"150px"} />
              <Text variant="heading" color="primary" mt={2} textAlign="center">
                {item.title}
              </Text>
              <Text
                variant="body"
                fontSize="title"
                color="grey"
                mt={1}
                textAlign="center"
                maxWidth="80%"
              >
                {item.description}
              </Text>
            </Flex>
          ))}
        </Carousel>
        <Flex
          flex={1}
          flexDirection="column"
          pt={2}
          sx={{
            borderRadius: "default",
          }}
          mt={25}
        >
          <Text variant="title" color="primary">
            {isLoggedIn ? "Upgrade now" : "Try it Now"}
            <Text variant="subBody" color="text">
              {isLoggedIn
                ? "Cancel anytime. No questions asked."
                : "Start your 14 Day Trial (no credit card required)"}
            </Text>
          </Text>
          <Text as="span" variant="body" fontSize={30} color="text" mt={3}>
            $4.49
            <Text as="span" variant="body" color="primary" fontSize="subBody">
              /mo
            </Text>
          </Text>
          <Button
            mt={1}
            fontSize="body"
            onClick={async () => {
              if (isLoggedIn) {
                await upgrade(user);
              } else {
                await showSignUpDialog();
              }
              props.onCancel();
            }}
          >
            {isLoggedIn ? "Subscribe to Notesnook Pro" : "Sign up now"}
          </Button>
        </Flex>
      </Flex>
    </Dialog>
  );
}
export default BuyDialog;
