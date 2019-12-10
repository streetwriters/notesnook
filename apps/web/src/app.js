import React, { useState, useEffect } from "react";
import "./app.css";
import Editor from "./components/editor";
import { ThemeProvider } from "emotion-theming";
import { Flex, Box, Button } from "rebass";
import theme from "./theme";
import { routes, navigate } from "./navigation";

const NavMenuItem = props => {
  useEffect(() => {
    if (props.selected) {
      navigate(props.item.key);
    }
  });
  return (
    <Button
      onClick={props.onSelected}
      variant="nav"
      sx={{
        width: "full",
        borderRadius: "none",
        textAlign: "center",
        color: props.selected ? "primary" : "text"
      }}
      px={0}
    >
      <props.item.icon
        size={25}
        strokeWidth={props.selected ? 2 : 1.3}
        style={{ marginRight: 3 }}
      />
      {/*  <Text sx={{ fontSize: 15, marginLeft: 1 }}>{props.item.title}</Text> */}
    </Button>
  );
};

function App() {
  const [selectedIndex, setSelectedIndex] = useState(1);
  return (
    <ThemeProvider theme={theme}>
      <Flex
        bg="background"
        sx={{ color: "text" }}
        height="100%"
        alignContent="stretch"
      >
        <Box
          width={[0, 0, 70]}
          sx={{ borderRight: "1px solid", borderRightColor: "border" }}
          px={0}
        >
          {Object.values(routes).map((item, index) => (
            <NavMenuItem
              onSelected={() => {
                navigate(item.key);
                setSelectedIndex(index);
              }}
              key={item.key}
              item={item}
              selected={selectedIndex === index}
            />
          ))}
        </Box>
        <Flex flex="1 1 auto" flexDirection="row" alignContent="stretch" px={0}>
          <Flex
            className="navigationView"
            sx={{ borderRight: "1px solid", borderColor: "border" }}
            flexDirection="column"
            flex="1 1 auto"
            px={3}
            py={3}
            width={["100%", "40%", "13%"]}
          />
          <Editor />
        </Flex>
        <Box id="snackbarContainer" />
      </Flex>
    </ThemeProvider>
  );
}

export default App;
