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

import { Text, Flex, Button, Image, Box } from "@theme-ui/components";
import Dialog from "../components/dialog";
import {
  Pro,
  Email,
  Discord,
  Twitter,
  Github,
  Loading
} from "../components/icons";
import { ReactComponent as E2E } from "../assets/e2e.svg";
import { ReactComponent as Note } from "../assets/note2.svg";
import { ReactComponent as Nomad } from "../assets/nomad.svg";
import { ReactComponent as WorkAnywhere } from "../assets/workanywhere.svg";
import { ReactComponent as Friends } from "../assets/cause.svg";
import LightUI from "../assets/light1.png";
import DarkUI from "../assets/dark1.png";
import GooglePlay from "../assets/play.png";
import AppleStore from "../assets/apple.png";
import { useStore as useThemeStore } from "../stores/theme-store";
import { Checkbox, Label } from "@theme-ui/components";
import { Features } from "../components/announcements/body";
import { showBuyDialog } from "../common/dialog-controller";
import { TaskManager } from "../common/task-manager";
import { db } from "../common/db";
import { usePersistentState } from "../hooks/use-persistent-state";
import AccentItem from "../components/accent-item";
import { useCallback, useState } from "react";
import Config from "../utils/config";
import { getAllAccents } from "@notesnook/theme";
import { isMacStoreApp } from "../utils/platform";
import { ErrorText } from "../components/error-text";
import { ThemeVariant } from "../components/theme-provider";

const newUserSteps = [
  {
    title: "Safe & encrypted notes",
    subtitle: "Write with freedom. Never compromise on privacy again.",
    buttonText: "Get started",
    image: <Note style={{ flexShrink: 0, width: 120, height: 120 }} />,
    component: TrackingConsent
  },
  {
    title: "Choose your style",
    subtitle:
      "You can change the theme at any time from Settings or the side menu.",
    buttonText: "Next",
    component: ThemeSelector
  },
  {
    image: <E2E style={{ flexShrink: 0, width: 180, height: 180 }} />,
    title: "Cross platform & 100% encrypted",
    subtitle:
      "Notesnook encrypts everything offline before syncing to your other devices. This means that no one can read your notes except you. Not even us.",
    component: CrossPlatform,
    buttonText: "Next"
  },
  {
    title: "Join the cause",
    subtitle:
      "Meet other privacy-minded people & talk to us directly about your concerns, issues and suggestions.",
    component: JoinCause,
    image: <Friends style={{ flexShrink: 0, width: 140, height: 140 }} />
  },
  {
    image: <Pro size={60} color="accent" />,
    title: "Notesnook Pro",
    subtitle: "Experience the next level of private note taking",
    component: TrialOffer
  }
];

const proUserSteps = [
  {
    title: "Welcome to Notesnook Pro",
    subtitle: "Thank you. You are the proof that privacy always comes first.",
    buttonText: "Next",
    image: <Nomad style={{ flexShrink: 0, width: 120, height: 120 }} />
  },
  {
    title: "Style your 'nook",
    subtitle: "Let's make Notesnook your new note taking home",
    buttonText: "Next",
    component: AccentSelector
  },
  {
    title: "We are always listening",
    subtitle: "If you face any issue, you can reach out to us anytime.",
    buttonText: "Next",
    component: Support
  },
  {
    title: "Import your notes",
    subtitle: "You can import your notes from most other note taking apps.",
    component: Importer
  }
];

const trialUserSteps = [
  {
    title: "Congratulations!",
    subtitle: "You 14-day free trial has been activated.",
    buttonText: "Continue",
    image: <WorkAnywhere style={{ flexShrink: 0, width: 160, height: 160 }} />
  }
];

const onboarding = {
  new: newUserSteps,
  pro: proUserSteps,
  trial: trialUserSteps
};

export function interruptedOnboarding() {
  for (let key in onboarding) {
    const index = Config.get(key, undefined);
    if (index === null || index === undefined) continue;
    if (index >= 0 && index < onboarding[key].length - 1) return key;
  }
}

function OnboardingDialog({ onClose: _onClose, type }) {
  const [step, setStep] = usePersistentState(type, 0);
  const steps = onboarding[type];

  const onClose = useCallback(() => {
    Config.set(type, steps.length);
    _onClose();
  }, [_onClose, type, steps]);

  const onNext = useCallback(() => {
    if (step === steps.length - 1) onClose();
    else setStep((s) => ++s);
  }, [onClose, setStep, step, steps.length]);

  if (!steps || !steps[step] || !type) {
    onClose();
    return null;
  }

  const {
    title,
    subtitle,
    image,
    component: Component,
    buttonText
  } = steps[step];

  return (
    <Dialog isOpen={true} width={500}>
      <Flex
        sx={{
          flexDirection: "column",
          alignItems: "center",
          overflowY: "auto"
        }}
      >
        {image}
        <Text variant={"heading"} mt={2}>
          {title}
        </Text>
        <ThemeVariant variant="secondary">
          <Text
            variant={"body"}
            sx={{ textAlign: "center", maxWidth: "70%", color: "paragraph" }}
          >
            {subtitle}
          </Text>
        </ThemeVariant>
        {Component && <Component onClose={onClose} onNext={onNext} />}
        {buttonText && (
          <Button
            sx={{ borderRadius: 50, px: 30, mb: 4, mt: Component ? 0 : 4 }}
            onClick={onNext}
          >
            {buttonText}
          </Button>
        )}
      </Flex>
    </Dialog>
  );
}
export default OnboardingDialog;

function JoinCause({ onNext }) {
  return (
    <Flex mb={4} sx={{ flexDirection: "column" }}>
      <Button
        as="a"
        href="https://discord.com/invite/zQBK97EE22"
        target="_blank"
        mt={4}
        variant={"primary"}
        sx={{ borderRadius: 50, alignSelf: "center", px: 30 }}
        onClick={() => onNext()}
      >
        Join the community
      </Button>
      <ThemeVariant variant="secondary">
        <Button
          variant={"anchor"}
          mt={2}
          onClick={() => onNext()}
          sx={{ color: "paragraph" }}
        >
          Skip for now
        </Button>
      </ThemeVariant>
    </Flex>
  );
}

const importers = [
  { title: "Evernote" },
  { title: "Simplenote" },
  { title: "HTML" },
  { title: "Markdown" },
  { title: "Google Keep" },
  { title: "Standard Notes" }
];
function Importer({ onClose }) {
  return (
    <Flex my={4} sx={{ flexDirection: "column" }}>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1 }}>
        {importers.map((importer) => (
          <Flex
            key={importer.title}
            sx={{
              display: "flex",
              flexDirection: "row",
              borderRadius: "default",
              border: "1px solid var(--border)",
              alignItems: "center",
              justifyContent: "center",
              p: 1
            }}
          >
            <Text variant={"body"} ml={1} sx={{ textAlign: "center" }}>
              {importer.title}
            </Text>
          </Flex>
        ))}
      </Box>
      <Button
        as="a"
        href="https://importer.notesnook.com/"
        target="_blank"
        mt={4}
        variant={"primary"}
        sx={{ borderRadius: 50, alignSelf: "center", px: 30 }}
        onClick={() => onClose()}
      >
        Start importing now
      </Button>
      <ThemeVariant variant="secondary">
        <Button
          variant={"anchor"}
          mt={2}
          onClick={() => onClose()}
          sx={{ color: "paragraph" }}
        >
          Skip for now
        </Button>
      </ThemeVariant>
    </Flex>
  );
}

function AccentSelector() {
  return (
    <Flex my={4}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr"
        }}
      >
        {getAllAccents().map((color) => (
          <AccentItem key={color.code} code={color.code} label={color.label} />
        ))}
      </Box>
    </Flex>
  );
}

const supportChannels = [
  {
    key: "email",
    url: "mailto:support@streetwriters.co",
    title: "Email us",
    icon: Email
  },
  {
    key: "discord",
    url: "https://discord.com/invite/zQBK97EE22",
    title: "Join the community",
    icon: Discord
  },
  {
    key: "twitter",
    url: "https://twitter.com/notesnook",
    title: "Follow us @notesnook",
    icon: Twitter
  },
  {
    key: "github",
    url: "https://github.com/streetwriters/notesnook",
    title: "Create an issue",
    icon: Github
  }
];

function Support() {
  return (
    <Box my={4} sx={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
      {supportChannels.map((channel) => (
        <Button
          key={channel.key}
          as="a"
          href={channel.url}
          variant={"icon"}
          sx={{
            display: "flex",
            flexDirection: "row",
            borderRadius: "default",
            alignItems: "center"
          }}
        >
          <channel.icon size={16} />
          <Text variant={"body"} ml={1}>
            {channel.title}
          </Text>
        </Button>
      ))}
    </Box>
  );
}

const themes = [
  { key: "light", name: "Light", image: LightUI },
  { key: "dark", name: "Dark", image: DarkUI }
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
            key={theme.key}
            p={20}
            sx={{
              borderRight: "1px solid var(--border)",
              bg: isSelected ? "shade" : "transparent",
              cursor: "pointer",
              ":last-of-type": {
                borderRight: "0px"
              },
              ":hover": {
                bg: "hover"
              },
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center"
            }}
            onClick={() => {
              setTheme(theme.key);
            }}
          >
            <Image
              src={theme.image}
              sx={{
                borderRadius: "default",
                border: isSelected ? "2px solid" : "none",
                borderColor: "accent",
                boxShadow: isSelected ? "0px 0px 10px 1px #00000016" : "none"
              }}
            />
            <Text variant={"subtitle"} mt={2} sx={{ color: "icon" }}>
              {theme.name}
            </Text>
          </Flex>
        );
      })}
    </Flex>
  );
}

function TrackingConsent() {
  const [enableTelemetry, setEnableTelemetry] = usePersistentState(
    "telemetry",
    false
  );
  return (
    <Label variant="text.subBody" my={4} sx={{ width: "80%" }}>
      <Checkbox
        checked={enableTelemetry}
        onChange={(e) => {
          setEnableTelemetry(e.target.checked);
        }}
        sx={{ width: 14 }}
      />
      <Text>
        Help improve Notesnook by sending completely anonymized product
        analytics.
      </Text>
    </Label>
  );
}

function CrossPlatform() {
  return (
    <Flex my={4} sx={{ alignItems: "center" }}>
      {isMacStoreApp() ? null : (
        <Image src={GooglePlay} sx={{ flexShrink: 0, width: 135 }} />
      )}
      <Image src={AppleStore} sx={{ flexShrink: 0, width: 110 }} />
    </Flex>
  );
}

function TrialOffer({ onClose }) {
  const [error, setError] = useState();
  const [loading, setLoading] = useState();
  return (
    <Flex
      my={4}
      sx={{
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <Features item={{ style: {} }} />
      {error ? (
        <ErrorText error={error} />
      ) : (
        <ThemeVariant variant="secondary">
          <Text
            variant={"body"}
            mt={2}
            bg="background"
            p={1}
            sx={{ borderRadius: "default", color: "paragraph" }}
          >
            <b>Note:</b> Upgrade now and get 50% discount on all plans.
          </Text>
        </ThemeVariant>
      )}

      <Flex mt={2} sx={{ justifyContent: "center", width: "100%" }}>
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
          onClick={async () => {
            try {
              setLoading(true);
              const result = await TaskManager.startTask({
                type: "status",
                id: "trialActivation",
                action: (report) => {
                  report({
                    text: "Activating trial"
                  });
                  return db.user.activateTrial();
                }
              });
              if (result) onClose();
            } catch (e) {
              setError(
                `Could not activate trial. Please try again. Error: ${e.message}`
              );
            } finally {
              setLoading(false);
            }
          }}
        >
          {loading ? <Loading size={16} /> : "Try free for 14 days"}
        </Button>
      </Flex>
      <ThemeVariant variant="secondary">
        <Button
          variant={"anchor"}
          mt={2}
          onClick={() => onClose()}
          sx={{ color: "paragraph" }}
        >
          Skip for now
        </Button>
      </ThemeVariant>
    </Flex>
  );
}
