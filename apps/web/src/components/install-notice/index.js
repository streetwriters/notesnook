import ReactDOM from "react-dom";
import { Box, Button, Flex, Text } from "rebass";
import Config from "../../utils/config";
import { getDownloadLink, getPlatform } from "../../utils/platform";
import DropdownButton from "../dropdown-button";
import ThemeProvider from "../theme-provider";

const nativeFeatures = [
  "Native high-performance encryption",
  "Automatic backups",
  "Pin notes in notifications drawer",
  "Share & append to notes from anywhere",
  "Quick note widgets",
  "App lock",
];

const platform = getPlatform();
const isMobile = platform === "Android" || platform === "iOS";
function getOptions(onClose) {
  return getDownloadLink(platform).map((item) => ({
    key: item.type || item.link,
    title: () => {
      return `${item.type}`;
    },
    onClick: () => {
      window.open(item.link, "_blank");
      onClose();
      Config.set("installNotice", false);
    },
  }));
}

export default function InstallNotice({ onClose }) {
  return (
    <Flex
      flexDirection={"column"}
      sx={{
        position: "absolute",
        top: ["initial", 2],
        right: [0, 2],
        left: [2, "initial"],
        bottom: [2, "initial"],
        zIndex: 2,
        bg: "background",
        borderRadius: "default",
        border: "1px solid var(--border)",
        width: ["95%", 400],
      }}
      p={2}
    >
      <Text variant={"title"}>Install Notesnook</Text>
      <Text variant={"body"}>
        For a more integrated user experience, try out Notesnook for {platform}.
      </Text>
      {isMobile && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            columnGap: 1,
            rowGap: 1,
            mt: 1,
          }}
        >
          {nativeFeatures.map((feature) => (
            <Flex
              p={1}
              sx={{
                borderRadius: "default",
                border: "1px solid var(--border)",
              }}
            >
              <Text variant="body" ml={1}>
                {feature}
              </Text>
            </Flex>
          ))}
        </Box>
      )}

      <Flex mt={[4, 1]} alignItems={"center"}>
        <DropdownButton title={"Options"} options={getOptions(onClose)} />
        <Button
          variant={"secondary"}
          ml={1}
          alignSelf={"start"}
          onClick={() => {
            onClose();
            Config.set("installNotice", false);
          }}
        >
          Don't show again
        </Button>
      </Flex>
    </Flex>
  );
}

export function showInstallNotice() {
  if (!Config.get("installNotice", true)) return;

  const root = document.getElementById("floatingViewContainer");

  if (root) {
    return new Promise((resolve) => {
      const perform = (result) => {
        ReactDOM.unmountComponentAtNode(root);
        resolve(result);
      };
      ReactDOM.render(
        <ThemeProvider>
          <InstallNotice onClose={perform} />
        </ThemeProvider>,
        root
      );
    });
  }
  return Promise.reject("No element with id 'floatingViewContainer'");
}
