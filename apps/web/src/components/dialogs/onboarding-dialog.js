import React, { useState } from "react";
import { Text, Flex, Button, Image, Box } from "rebass";
import Dialog from "./dialog";
import * as Icon from "../icons";
import { getHomeRoute, hardNavigate } from "../../navigation";
import { ReactComponent as E2E } from "../../assets/e2e.svg";
import { ReactComponent as Note } from "../../assets/note2.svg";
import LightUI from "../../assets/light1.png";
import DarkUI from "../../assets/dark1.png";
import GooglePlay from "../../assets/play.png";
import AppleStore from "../../assets/apple.png";
import { useStore as useThemeStore } from "../../stores/theme-store";
import { Checkbox, Label } from "@rebass/forms";
import { Features } from "../announcements/body";
import { showBuyDialog } from "../../common/dialog-controller";

const steps = [
  {
    title: "Safe & encrypted notes",
    subtitle: "Write with freedom. Never compromise on privacy again.",
    buttonText: "Get started",
    image: <Note width={120} />,
    component: TrackingConsent,
  },
  {
    title: "Choose your style",
    subtitle:
      "You can change the theme at any time from Settings or the side menu.",
    buttonText: "Next",
    component: ThemeSelector,
  },
  {
    image: <E2E width={180} />,
    title: "Cross platform & 100% encrypted",
    subtitle:
      "Notesnook encrypts everything offline before syncing to your other devices. This means that no one can read your notes except you. Not even us.",
    component: CrossPlatform,
    buttonText: "Next",
  },
  {
    image: <Icon.Pro size={60} color="primary" />,
    title: "Notesnook Pro",
    subtitle: "Experience the next level of private note taking",
    component: TrialOffer,
  },
];

function OnboardingDialog(props) {
  const [step, setStep] = useState(0);
  const {
    title,
    subtitle,
    image,
    component: Component,
    buttonText,
  } = steps[step];
  return (
    <Dialog isOpen={true} width={500}>
      <Flex flexDirection="column" overflowY="auto" alignItems={"center"}>
        {image}
        <Text variant={"heading"} mt={2}>
          {title}
        </Text>
        <Text variant={"body"} color="fontTertiary" textAlign={"center"}>
          {subtitle}
        </Text>
        {Component && <Component onClose={props.onClose} />}
        {buttonText && (
          <Button
            sx={{ borderRadius: 50, px: 30, mb: 4 }}
            onClick={() => setStep((s) => ++s)}
          >
            {buttonText}
          </Button>
        )}
      </Flex>
    </Dialog>
  );
}
export default OnboardingDialog;

const themes = [
  { key: "light", name: "Light", image: LightUI },
  { key: "dark", name: "Dark", image: DarkUI },
];

function ThemeSelector() {
  const currentTheme = useThemeStore((store) => store.theme);
  const setTheme = useThemeStore((store) => store.setTheme);

  return (
    <Flex
      sx={{ border: "1px solid var(--border)", borderRadius: "default" }}
      my={4}
    >
      {themes.map((theme) => {
        const isSelected = currentTheme === theme.key;
        return (
          <Flex
            flexDirection={"column"}
            p={20}
            alignItems="center"
            justifyContent={"center"}
            sx={{
              borderRight: "1px solid var(--border)",
              bg: isSelected ? "bgSecondary" : "transparent",
              cursor: "pointer",
              ":last-of-type": {
                borderRight: "0px",
              },
              ":hover": {
                bg: "hover",
              },
            }}
            onClick={() => {
              setTheme(theme.key);
            }}
          >
            <Image
              src={theme.image}
              sx={{
                borderRadius: "default",
                border: isSelected ? "2px solid var(--primary)" : "none",
                boxShadow: isSelected ? "0px 0px 10px 1px #00000016" : "none",
              }}
            />
            <Text variant={"subtitle"} color="icon" mt={2}>
              {theme.name}
            </Text>
          </Flex>
        );
      })}
    </Flex>
  );
}

function TrackingConsent() {
  return (
    <Label variant="text.subBody" my={4} width="80%">
      <Checkbox width={14} checked />
      <Text>
        Help improve Notesnook by sending completely anonymized product
        analytics.
      </Text>
    </Label>
  );
}

function CrossPlatform() {
  return (
    <Flex my={4} alignItems="center">
      <Image src={GooglePlay} flexShrink={0} width={135} />
      <Image src={AppleStore} flexShrink={0} width={110} />
    </Flex>
  );
}

function TrialOffer({ onClose }) {
  return (
    <Flex
      my={4}
      flexDirection="column"
      justifyContent={"center"}
      alignItems="center"
    >
      <Features item={{ style: {} }} />
      <Text
        variant={"body"}
        mt={2}
        bg="bgSecondary"
        color="icon"
        p={1}
        sx={{ borderRadius: "default" }}
      >
        <b>Note:</b> Upgrade now and get a flat 50% discount on all plans.
      </Text>
      <Flex mt={2} width="100%" justifyContent={"center"}>
        <Button
          sx={{ borderRadius: 50, alignSelf: "center", mr: 2, width: "40%" }}
          onClick={() => {
            onClose();
            showBuyDialog("monthly", "TRIAL2PRO");
          }}
        >
          Upgrade now
        </Button>
        <Button
          variant={"secondary"}
          sx={{ borderRadius: 50, alignSelf: "center", width: "40%" }}
          onClick={() => {
            onClose();
          }}
        >
          Try free for 14 days
        </Button>
      </Flex>
      <Button variant={"anchor"} color="fontTertiary" mt={2} onClick={onClose}>
        Skip for now
      </Button>
    </Flex>
  );
}
