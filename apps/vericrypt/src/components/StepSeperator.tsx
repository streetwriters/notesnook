import { Flex, Text } from "@theme-ui/components";
import { useState } from "react";
import { IconType } from "react-icons";
import { MdClose } from "react-icons/md";
import { ThemeProvider } from "theme-ui";
import { ThemeFactory } from "../theme";

type StepSeperatorProps = {
  icon?: IconType;
  onShowPopup?: () => Promise<boolean>;
  tooltip?: string;
  popup?: { title: string; body?: JSX.Element };
};

export function StepSeperator(props: StepSeperatorProps) {
  const [showPopup, setShowPopup] = useState<boolean>(false);

  return (
    <Flex
      sx={{
        height: 200,
        width: 2,
        bg: "bgSecondary",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
      }}
    >
      <Flex
        sx={{
          position: "absolute",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
        tabIndex={1}
      >
        {props.icon && (
          <Flex
            sx={{
              bg: "background",
              p: 2,
              boxShadow: "0px 0px 10px 0px #00000011",
              borderRadius: 50,
              transition: "transform 100ms ease-out",
              cursor: "pointer",
              ":hover": {
                transform: "scale(1.1)",
              },
            }}
            title={props.tooltip}
            onClick={async () => {
              if (showPopup) return setShowPopup(false);
              if (!showPopup && props.onShowPopup)
                setShowPopup(await props.onShowPopup());
            }}
          >
            <props.icon size={20} />
          </Flex>
        )}
        {showPopup && props.popup && (
          <Flex
            sx={{
              position: "absolute",
              top: 60,
              p: 2,
              width: 400,
            }}
          >
            <ThemeProvider theme={ThemeFactory.construct("dark")}>
              <Flex
                sx={{
                  bg: "background",
                  borderRadius: "default",
                  boxShadow: "0px 0px 10px 0px #00000011",
                  p: 2,
                  flexDirection: "column",
                  color: "icon",
                }}
              >
                <Flex
                  sx={{ justifyContent: "space-between", alignItems: "center" }}
                >
                  <Text variant="title">{props.popup.title}</Text>
                  <MdClose
                    style={{ cursor: "pointer" }}
                    onClick={() => setShowPopup(false)}
                  />
                </Flex>
                {props.popup.body}
              </Flex>
            </ThemeProvider>
          </Flex>
        )}
      </Flex>
    </Flex>
  );
}
