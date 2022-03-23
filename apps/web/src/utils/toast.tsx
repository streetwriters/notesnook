import CogoToast, { CTReturn } from "cogo-toast";
import { Button, Flex, Text } from "rebass";
import ThemeProvider from "../components/theme-provider";
import { Error, Warn, Success } from "../components/icons";
import { store as appstore } from "../stores/app-store";

type ToastType = "success" | "error" | "warn" | "info";
type ToastAction = {
  text: string;
  onClick: () => void;
  type: "primary" | "text";
};

function showToast(
  type: ToastType,
  message: string,
  actions?: ToastAction[],
  hideAfter?: number
): CTReturn | null | undefined {
  if (appstore.get().isFocusMode) return null;
  const IconComponent =
    type === "error" ? Error : type === "success" ? Success : Warn;
  const toast = CogoToast[type];
  if (!toast) return;
  const t = toast(<ToastContainer message={message} actions={actions} />, {
    position: "top-right",
    hideAfter:
      hideAfter === undefined
        ? actions
          ? 5
          : type === "error"
          ? 5
          : 3
        : hideAfter,
    bar: { size: "0px" },
    renderIcon: () => {
      return (
        <ThemeProvider>
          <IconComponent size={28} color={type} />
        </ThemeProvider>
      );
    },
  });
  return t;
}

type ToastContainerProps = {
  message: string;
  actions?: ToastAction[];
};

function ToastContainer(props: ToastContainerProps) {
  const { message, actions } = props;
  return (
    <ThemeProvider>
      <Flex
        data-test-id="toast"
        justifyContent="center"
        alignItems="center"
        my={2}
        sx={{ borderRadius: "default" }}
      >
        <Text
          data-test-id="toast-message"
          variant="body"
          fontSize="body"
          color="text"
          mr={2}
        >
          {message}
        </Text>
        {actions?.map((action) => (
          <Button
            flexShrink={0}
            variant="primary"
            color={action.type}
            fontWeight="bold"
            bg={"transparent"}
            fontSize="body"
            sx={{
              py: "7px",
              ":hover": { bg: "bgSecondary" },
              m: 0,
            }}
            key={action.text}
            onClick={action.onClick}
          >
            {action.text}
          </Button>
        ))}
      </Flex>
    </ThemeProvider>
  );
}

export { showToast };
