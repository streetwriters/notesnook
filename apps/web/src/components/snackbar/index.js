import React from "react";
import ReactDOM from "react-dom";
import { Flex, Text } from "rebass";
import { ThemeProvider } from "../../utils/theme";

export function showSnack(message, icon = undefined) {
  const root = document.getElementById("snackbarContainer");
  if (root) {
    ReactDOM.render(<Snackbar message={message} Icon={icon} />, root);
    setTimeout(() => {
      const snackbar = document.getElementById("snackbar");
      if (!snackbar) return;
      setTimeout(() => ReactDOM.unmountComponentAtNode(root), 700);
      snackbar.animate(
        {
          opacity: [1, 0],
          transform: ["translateY(0px)", "translateY(500px)"]
        },
        1000
      );
    }, 3000);
  }
}

function Snackbar(props) {
  return (
    <ThemeProvider>
      <Flex
        id="snackbar"
        sx={{
          position: "absolute",
          bottom: 10,
          left: "50%",
          textAlign: "center",
          color: "static",
          fontFamily: "body",
          fontWeight: "body",
          borderRadius: "default",
          animation: "1s ease-out fadeUp"
        }}
        alignItems="center"
        flexDirection="row"
        bg="primary"
        py={2}
        px={2}
      >
        {props.Icon && <props.Icon size={18} />}
        <Text mx={1}>{props.message}</Text>
      </Flex>
    </ThemeProvider>
  );
}
