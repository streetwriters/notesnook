import React, { useState } from "react";
import "./app.css";
import SideBar from "./Components/SideBar";
import { ThemeProvider } from "emotion-theming";
import { Flex, Box, Text, Button, Card } from "rebass";
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
        size={15}
        style={{ marginTop: 2 /* correction with Quicksand font */ }}
      />
      <Text sx={{ fontSize: 15, marginLeft: 1 }}>{props.item.title}</Text>
    </Flex>
  </Button>
);

function App() {
  const navItems = [
    { title: "Home", icon: Icon.Home },
    { title: "Notebooks", icon: Icon.Book },
    { title: "Folders", icon: Icon.Folder },
    { title: "Lists", icon: Icon.List },
    { title: "Get Pro", icon: Icon.Star }
  ];
  const [selectedIndex, setSelectedIndex] = useState(0);
  return (
    <ThemeProvider theme={theme}>
      <Flex height="100%" alignContent="stretch">
        <Box width="13%" bg="navbg" px={0}>
          {navItems.map((item, index) => (
            <NavMenuItem
              onSelected={() => setSelectedIndex(index)}
              key={item.title}
              item={item}
              selected={selectedIndex === index}
            />
          ))}
        </Box>
        <Box px={2} py={2}>
          <Card />
        </Box>
      </Flex>
    </ThemeProvider>
  );
}

export default App;
