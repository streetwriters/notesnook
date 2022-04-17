import { Button, ButtonProps, Flex, Text } from "rebass";
import { Icon } from "./icon";
import { IconNames, Icons } from "../icons";
import { PropsWithChildren } from "react";
import { SchemeColors } from "@notesnook/theme/dist/theme/colorscheme";

type PopupProps = {
  title?: string;
  action?: PopupButtonProps;
};

export function Popup(props: PropsWithChildren<PopupProps>) {
  const { title, action, children } = props;

  return (
    <Flex
      sx={{
        bg: "background",
        flexDirection: "column",
        borderRadius: "default",
        border: "1px solid var(--border)",
        boxShadow: "menu",
      }}
    >
      {title && (
        <Flex
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            mx: 1,
            mt: 1,
          }}
        >
          <Text variant={"subtitle"}>{title}</Text>
          {action && (
            <PopupButton data-test-id="popup-no" color="text" {...action} />
          )}
        </Flex>
      )}
      {children}
    </Flex>
  );
}

type PopupButtonProps = ButtonProps & {
  text?: string;
  loading?: boolean;
  icon?: IconNames;
  iconSize?: number;
  iconColor?: keyof SchemeColors;
};
function PopupButton(props: PopupButtonProps) {
  const { text, loading, icon, iconColor, iconSize, ...restProps } = props;
  return (
    <Button variant="dialog" sx={{ p: 1, px: 2 }} {...restProps}>
      {loading ? (
        <Icon path={Icons.loading} size={16} rotate color="primary" />
      ) : icon ? (
        <Icon
          path={Icons[icon]}
          size={iconSize || 18}
          color={iconColor || "icon"}
        />
      ) : (
        text
      )}
    </Button>
  );
}
