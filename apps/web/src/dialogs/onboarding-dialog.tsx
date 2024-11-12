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

import { Text, Flex, Button, Image, Box, Link } from "@theme-ui/components";
import Dialog from "../components/dialog";
import {
  Pro,
  Email,
  Discord,
  Twitter,
  Github,
  Loading
} from "../components/icons";
import E2E from "../assets/e2e.svg?url";
import Note from "../assets/note2.svg?url";
import Nomad from "../assets/nomad.svg?url";
import WorkAnywhere from "../assets/workanywhere.svg?url";
import Friends from "../assets/cause.svg?url";
import LightUI from "../assets/light1.png?url";
import DarkUI from "../assets/dark1.png?url";
import GooglePlay from "../assets/play.png?url";
import AppleStore from "../assets/apple.png?url";
import { useStore as useThemeStore } from "../stores/theme-store";
import { Features } from "../components/announcements/body";
import { TaskManager } from "../common/task-manager";
import { db } from "../common/db";
import { usePersistentState } from "../hooks/use-persistent-state";
import { useCallback, useState } from "react";
import Config from "../utils/config";
import { isMacStoreApp } from "../utils/platform";
import { ErrorText } from "../components/error-text";
import { BuyDialog } from "./buy-dialog";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import { strings } from "@notesnook/intl";

type Step = {
  title: string;
  subtitle: string;
  buttonText?: string;
  image?: JSX.Element;
  component?:
    | (() => JSX.Element)
    | ((props: { onNext: () => void }) => JSX.Element)
    | ((props: { onClose: () => void }) => JSX.Element);
};

const newUserSteps: Step[] = [
  {
    title: strings.safeEncryptedNotes(),
    subtitle: strings.writeWithFreedom(),
    buttonText: strings.getStarted(),
    image: (
      <Image src={Note} style={{ flexShrink: 0, width: 120, height: 120 }} />
    )
  },
  {
    title: strings.chooseYourStyle(),
    subtitle: strings.changeTheme(),
    buttonText: strings.next(),
    component: ThemeSelector
  },
  {
    image: (
      <Image src={E2E} style={{ flexShrink: 0, width: 180, height: 180 }} />
    ),
    title: strings.crossPlatformEncrypted(),
    subtitle: strings.encryptsEverything(),
    component: CrossPlatform,
    buttonText: strings.next()
  },
  {
    title: strings.joinTheCause(),
    subtitle: strings.meetPrivacyMinded(),
    component: JoinCause,
    image: (
      <Image src={Friends} style={{ flexShrink: 0, width: 140, height: 140 }} />
    )
  },
  {
    image: <Pro size={60} color="accent" />,
    title: strings.notesnookPro(),
    subtitle: strings.nextLevelPrivateNoteTaking(),
    component: TrialOffer
  }
];

const proUserSteps: Step[] = [
  {
    title: strings.welcomeToNotesnookPro(),
    subtitle: strings.thankYouPrivacy(),
    buttonText: strings.next(),
    image: (
      <Image src={Nomad} style={{ flexShrink: 0, width: 120, height: 120 }} />
    )
  },
  {
    title: strings.weAreAlwaysListening(),
    subtitle: strings.weAreAlwaysListening(),
    buttonText: strings.next(),
    component: Support
  },
  {
    title: strings.importYourNotes(),
    subtitle: strings.importYourNotes(),
    component: Importer
  }
];

const trialUserSteps: Step[] = [
  {
    title: strings.congratulations(),
    subtitle: strings.trialStarted(),
    buttonText: strings.continue(),
    image: (
      <Image
        src={WorkAnywhere}
        style={{ flexShrink: 0, width: 160, height: 160 }}
      />
    )
  }
];

const onboarding = {
  new: newUserSteps,
  pro: proUserSteps,
  trial: trialUserSteps
} as const;

export function interruptedOnboarding(): keyof typeof onboarding | undefined {
  for (const key in onboarding) {
    const index = Config.get(key, undefined);
    if (index === null || index === undefined) continue;
    if (
      index >= 0 &&
      index < onboarding[key as keyof typeof onboarding].length - 1
    )
      return key as keyof typeof onboarding;
  }
}

type OnboardingDialogProps = BaseDialogProps<boolean> & {
  type: keyof typeof onboarding;
};
export const OnboardingDialog = DialogManager.register(
  function OnboardingDialog({
    onClose: _onClose,
    type
  }: OnboardingDialogProps) {
    const [step, setStep] = usePersistentState(type, 0);
    console.log("STEPS", type);
    const steps = onboarding[type];

    const onClose = useCallback(
      (result: boolean) => {
        Config.set(type, steps.length);
        _onClose(result);
      },
      [_onClose, type, steps]
    );

    const onNext = useCallback(() => {
      if (step === steps.length - 1) onClose(true);
      else setStep((s) => ++s);
    }, [onClose, setStep, step, steps.length]);

    if (!steps || !steps[step] || !type) {
      onClose(false);
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
          <Text
            variant={"body"}
            sx={{
              textAlign: "center",
              maxWidth: "70%",
              color: "var(--paragraph-secondary)"
            }}
          >
            {subtitle}
          </Text>
          {Component && (
            <Component onClose={() => onClose(true)} onNext={onNext} />
          )}
          {buttonText && (
            <Button
              variant="accent"
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
);

function JoinCause({ onNext }: { onNext: () => void }) {
  return (
    <Flex mb={4} sx={{ flexDirection: "column" }}>
      <Button
        as="a"
        mt={4}
        variant="accent"
        sx={{ borderRadius: 50, alignSelf: "center", px: 30 }}
        onClick={() => {
          window.open("https://go.notesnook.com/discord", "_blank");
          onNext();
        }}
      >
        {strings.joinDiscord()}
      </Button>
      <Button
        variant={"anchor"}
        mt={2}
        onClick={() => onNext()}
        sx={{ color: "var(--paragraph-secondary)" }}
      >
        {strings.skip()}
      </Button>
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
function Importer({ onClose }: { onClose: () => void }) {
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
        mt={4}
        variant="accent"
        sx={{ borderRadius: 50, alignSelf: "center", px: 30 }}
        onClick={() => {
          window.open("https://importer.notesnook.com/", "_blank");
          onClose();
        }}
      >
        {strings.startImportingNow()}
      </Button>
      <Button
        variant={"anchor"}
        mt={2}
        onClick={() => onClose()}
        sx={{ color: "var(--paragraph-secondary)" }}
      >
        {strings.skip()}
      </Button>
    </Flex>
  );
}

const supportChannels = [
  {
    key: "email",
    url: "mailto:support@streetwriters.co",
    title: strings.emailSupport(),
    icon: Email
  },
  {
    key: "discord",
    url: "https://discord.com/invite/zQBK97EE22",
    title: strings.joinDiscord(),
    icon: Discord
  },
  {
    key: "twitter",
    url: "https://twitter.com/notesnook",
    title: strings.followOnX(),
    icon: Twitter
  },
  {
    key: "github",
    url: "https://github.com/streetwriters/notesnook",
    title: strings.reportAnIssue(),
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
          variant={"icon"}
          sx={{
            display: "flex",
            flexDirection: "row",
            borderRadius: "default",
            alignItems: "center"
          }}
          onClick={() => window.open(channel.url)}
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
  { key: "light" as const, name: "Light", image: LightUI },
  { key: "dark" as const, name: "Dark", image: DarkUI }
];

function ThemeSelector() {
  const currentTheme = useThemeStore((store) => store.colorScheme);
  const setTheme = useThemeStore((store) => store.setColorScheme);

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

function CrossPlatform() {
  return (
    <Flex my={4} sx={{ alignItems: "center" }}>
      {isMacStoreApp() ? null : (
        <Link
          href="https://play.google.com/store/apps/details?id=com.streetwriters.notesnook"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image src={GooglePlay} sx={{ flexShrink: 0, width: 135 }} />
        </Link>
      )}
      <Link
        href="https://apps.apple.com/us/app/notesnook-take-private-notes/id1544027013"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Image src={AppleStore} sx={{ flexShrink: 0, width: 110 }} />
      </Link>
    </Flex>
  );
}

function TrialOffer({ onClose }: { onClose: () => void }) {
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState<boolean>();
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
        <Text
          variant={"body"}
          mt={2}
          bg="var(--background-secondary)"
          p={1}
          sx={{ borderRadius: "default", color: "var(--paragraph-secondary)" }}
        >
          <b>Note:</b> Upgrade now and get 50% discount on all plans.
        </Text>
      )}

      <Flex mt={2} sx={{ justifyContent: "center", width: "100%" }}>
        <Button
          variant="accent"
          sx={{ borderRadius: 50, alignSelf: "center", mr: 2, width: "40%" }}
          onClick={() => {
            onClose();
            BuyDialog.show({ plan: "monthly", couponCode: "TRIAL2PRO" });
          }}
        >
          {strings.upgradeToPro()}
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
                title: strings.activatingTrial(),
                action: () => db.user.activateTrial()
              });
              if (result) onClose();
            } catch (e) {
              setError(
                `Could not activate trial. Please try again. Error: ${
                  (e as Error).message
                }`
              );
            } finally {
              setLoading(false);
            }
          }}
        >
          {loading ? <Loading size={16} /> : strings.tryFreeFor14Days()}
        </Button>
      </Flex>
      <Button
        variant={"anchor"}
        mt={2}
        onClick={() => onClose()}
        sx={{ color: "var(--paragraph-secondary)" }}
      >
        {strings.skip()}
      </Button>
    </Flex>
  );
}
