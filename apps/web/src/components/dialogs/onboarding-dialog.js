import { Text, Flex, Button, Image, Box } from "rebass";
import Dialog from "./dialog";
import * as Icon from "../icons";
import { ReactComponent as E2E } from "../../assets/e2e.svg";
import { ReactComponent as Note } from "../../assets/note2.svg";
import { ReactComponent as Nomad } from "../../assets/nomad.svg";
import LightUI from "../../assets/light1.png";
import DarkUI from "../../assets/dark1.png";
import GooglePlay from "../../assets/play.png";
import AppleStore from "../../assets/apple.png";
import { useStore as useThemeStore } from "../../stores/theme-store";
import { Checkbox, Label } from "@rebass/forms";
import { Features } from "../announcements/body";
import { showBuyDialog } from "../../common/dialog-controller";
import { TaskManager } from "../../common/task-manager";
import { db } from "../../common/db";
import { usePersistentState } from "../../utils/hooks";
import accents from "../../theme/accents";
import AccentItem from "../accent-item";

const newUserSteps = [
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

const proUserSteps = [
  {
    title: "Welcome to Notesnook Pro",
    subtitle: "Let's make Notesnook your new private note taking home",
    buttonText: "Next",
    image: <Nomad width={120} />,
    component: AccentSelector,
  },
  {
    title: "High priority support",
    subtitle: "If you face any issue, you can reach out to us anytime.",
    buttonText: "Next",
    component: Support,
  },
  {
    title: "Import your notes",
    subtitle: "You can import your notes from most other note taking apps.",
    component: Importer,
  },
];

const onboarding = {
  new: newUserSteps,
  pro: proUserSteps,
};

function OnboardingDialog({ onClose, type }) {
  const [step, setStep] = usePersistentState(type, 0);
  const {
    title,
    subtitle,
    image,
    component: Component,
    buttonText,
  } = onboarding[type][step];

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
        {Component && <Component onClose={onClose} />}
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

const importers = [
  { title: "Evernote" },
  { title: "Simplenote" },
  { title: "HTML" },
  { title: "Markdown" },
  { title: "Text" },
  { title: "Google Keep" },
  { title: "Standard Notes" },
];
function Importer({ onClose }) {
  return (
    <Flex my={4} flexDirection={"column"}>
      <Box
        sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 1 }}
      >
        {importers.map((importer) => (
          <Flex
            sx={{
              display: "flex",
              flexDirection: "row",
              borderRadius: "default",
              border: "1px solid var(--border)",
              alignItems: "center",
              p: 1,
            }}
          >
            <Text variant={"body"} ml={1}>
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
        sx={{ borderRadius: 50, alignSelf: "center", width: "40%" }}
      >
        Start importing now
      </Button>
      <Button
        variant={"anchor"}
        color="fontTertiary"
        mt={2}
        onClick={() => onClose()}
      >
        Skip for now
      </Button>
    </Flex>
  );
}

function AccentSelector() {
  return (
    <Flex my={4}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr",
        }}
      >
        {accents.map((color) => (
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
    icon: Icon.Email,
  },
  {
    key: "discord",
    url: "https://discord.com/invite/zQBK97EE22",
    title: "Join the community",
    icon: Icon.Discord,
  },
  {
    key: "twitter",
    url: "https://twitter.com/notesnook",
    title: "Follow us @notesnook",
    icon: Icon.Twitter,
  },
  {
    key: "github",
    url: "https://github.com/streetwriters/notesnook",
    title: "Create an issue",
    icon: Icon.Github,
  },
];

function Support() {
  return (
    <Box my={4} sx={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
      {supportChannels.map((channel) => (
        <Button
          as="a"
          href={channel.url}
          variant={"icon"}
          sx={{
            display: "flex",
            flexDirection: "row",
            borderRadius: "default",
            alignItems: "center",
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
  const [enableTelemetry, setEnableTelemetry] = usePersistentState(
    "telemetry",
    true
  );
  return (
    <Label variant="text.subBody" my={4} width="80%">
      <Checkbox
        width={14}
        checked={enableTelemetry}
        onChange={(e) => {
          setEnableTelemetry(e.target.checked);
        }}
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
        <b>Note:</b> Upgrade now and get 50% discount on all plans.
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
          onClick={async () => {
            onClose();
            await TaskManager.startTask({
              type: "modal",
              title: "Activating your trial",
              subtitle: "Please wait while we activate your 14 day trial.",
              action: (report) => {
                report({
                  text: "This trial is completely free of charge. No credit card or other information is required on your part.",
                });
                return db.user.activateTrial();
              },
            });
          }}
        >
          Try free for 14 days
        </Button>
      </Flex>
      <Button
        variant={"anchor"}
        color="fontTertiary"
        mt={2}
        onClick={() => onClose()}
      >
        Skip for now
      </Button>
    </Flex>
  );
}
