import { Button, Flex, Text } from "rebass";
import ThemeProvider from "../components/theme-provider";
import { Error, Warn, Success } from "../components/icons";
import { store as appstore } from "../stores/app-store";
import toast from "react-hot-toast";

type ToastType = "success" | "error" | "warn" | "info";
type ToastAction = {
  text: string;
  onClick: () => void;
  type?: "primary" | "text";
};

function showToast(
  type: ToastType,
  message: string,
  actions?: ToastAction[],
  hideAfter: number = 5000
): { hide: () => void } {
  if (appstore.get().isFocusMode) return { hide: () => {} }; // TODO

  const IconComponent =
    type === "error" ? Error : type === "success" ? Success : Warn;

  const RenderedIcon = () => <IconComponent size={28} color={type} />;

  const id = toast(<ToastContainer message={message} actions={actions} />, {
    duration: hideAfter || Infinity,
    icon: <RenderedIcon />,
    id: message,
    position: "bottom-right",
    style: {
      maxWidth: "auto",
      backgroundColor: "var(--background)"
    }
  });
  return { hide: () => toast.dismiss(id) };
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
        bg={"background"}
        data-test-id="toast"
        justifyContent="center"
        alignItems="center"
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
            color={action.type || "primary"}
            fontWeight="bold"
            bg={"transparent"}
            fontSize="body"
            sx={{
              py: "7px",
              ":hover": { bg: "bgSecondary" },
              m: 0
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
