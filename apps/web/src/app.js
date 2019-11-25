import React, { useState } from "react";
import "./app.css";
import Editor from "./Components/Editor";
import { ThemeProvider } from "emotion-theming";
import { Flex, Box, Text, Button, Card, Heading } from "rebass";
import * as Icon from "react-feather";
import theme from "./theme";

const NavMenuItem = props => (
  <Button
    onClick={props.onSelected}
    variant="nav"
    sx={{
      width: "full",
      borderRadius: "none",
      textAlign: "left"
    }}
    px={0}
  >
    <Flex flexDirection="row">
      <Box
        bg="accent"
        width={5}
        sx={{
          opacity: props.selected ? 1 : 0,
          marginRight: 3,
          borderTopRightRadius: 3,
          borderBottomRightRadius: 3
        }}
      />
      <props.item.icon
        size={25}
        stroke-width={1.3}
        style={{ marginRight: 3 }}
      />
      {/*  <Text sx={{ fontSize: 15, marginLeft: 1 }}>{props.item.title}</Text> */}
    </Flex>
  </Button>
);

function App() {
  const navItems = [
    { title: "Arkane", icon: Icon.User },
    { title: "Home", icon: Icon.Home },
    { title: "Notebooks", icon: Icon.Book },
    { title: "Folders", icon: Icon.Folder },
    { title: "Lists", icon: Icon.List },
    { title: "Get Pro", icon: Icon.Star }
  ];
  const [selectedIndex, setSelectedIndex] = useState(1);
  return (
    <ThemeProvider theme={theme}>
      <Flex height="100%" alignContent="stretch">
        <Box width="4%" bg="navbg" px={0}>
          {navItems.map((item, index) => (
            <NavMenuItem
              onSelected={() => setSelectedIndex(index)}
              key={item.title}
              item={item}
              selected={selectedIndex === index}
            />
          ))}
        </Box>
        <Flex flex="1 1 auto" flexDirection="row" alignContent="stretch" px={0}>
          <Box bg="#fbfbfb" flex="1 1 auto" px={0}></Box>
          <Editor />
        </Flex>
      </Flex>
    </ThemeProvider>
  );
}

export default App;
