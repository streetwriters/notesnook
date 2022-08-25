import { Button, ButtonProps, Flex, Text } from "rebass";
import { Icon } from "./icon";
import { IconNames, Icons } from "../icons";
import { PropsWithChildren } from "react";
import { SchemeColors } from "@streetwriters/theme/dist/theme/colorscheme";
import { DesktopOnly, MobileOnly } from "../../components/responsive";

type Action = {
  title: string;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
};
export type PopupProps = {
  title?: string;
  onClose?: () => void;
  action?: Action;
};

export function Popup(props: PropsWithChildren<PopupProps>) {
  const { title, onClose, action, children } = props;

  return (
    <>
      <DesktopOnly>
        <Flex
          sx={{
            overflow: "hidden",
            bg: "background",
            flexDirection: "column",
            borderRadius: "default",
            // border: "1px solid var(--border)",
            boxShadow: "menu",
            minWidth: 200,
          }}
        >
          {title && (
            <Flex
              className="movable"
              sx={{
                justifyContent: "space-between",
                alignItems: "center",
                p: 2,
              }}
            >
              <Text variant={"title"}>{title}</Text>
              <Button
                variant={"tool"}
                sx={{ p: 0, bg: "transparent" }}
                onClick={onClose}
              >
                <Icon path={Icons.close} size={"big"} />
              </Button>
            </Flex>
          )}
          {children}
          {title && action && (
            <Flex
              sx={{ justifyContent: "end" }}
              bg="bgSecondary"
              p={1}
              px={2}
              mt={2}
            >
              <Button
                variant="dialog"
                onClick={
                  action.disabled || action.loading ? undefined : action.onClick
                }
                disabled={action.disabled || action.loading}
              >
                {action.loading ? (
                  <Icon path={Icons.loading} rotate size="medium" />
                ) : (
                  action.title
                )}
              </Button>
            </Flex>
          )}
        </Flex>
      </DesktopOnly>
      <MobileOnly>
        {children}

        {action && (
          <Button
            variant={"primary"}
            sx={{
              alignSelf: "stretch",
              mb: 1,
              mt: 2,
              mx: 1,
              py: 2,
            }}
            onClick={action.disabled ? undefined : action?.onClick}
            disabled={action.disabled}
          >
            {action.loading ? (
              <Icon path={Icons.loading} rotate size="medium" />
            ) : (
              action.title
            )}
          </Button>
        )}
      </MobileOnly>
    </>
  );
}
