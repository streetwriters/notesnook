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
      textAlign: "center",
      color: props.selected ? "accent" : "fontPrimary"
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
const navItems = [
  { title: "Arkane", icon: Icon.User },
  { title: "Home", icon: Icon.Home },
  { title: "Notebooks", icon: Icon.Book },
  { title: "Folders", icon: Icon.Folder },
  { title: "Lists", icon: Icon.List },
  { title: "Get Pro", icon: Icon.Star }
];
function App() {
  const [selectedIndex, setSelectedIndex] = useState(1);
  return (
    <ThemeProvider theme={theme}>
      <Flex height="100%" alignContent="stretch">
        <Box minWidth={70} maxWidth={70} bg="navbg" px={0}>
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
          <Flex
            bg="#fbfbfb"
            flexDirection="column"
            flex="1 1 auto"
            px={3}
            py={3}
            width="15%"
          >
            <Heading fontSize="heading">Notes</Heading>
            <input
              placeholder="Search"
              style={{
                marginTop: 8,
                marginBottom: 16,
                borderRadius: 5,
                borderWidth: 0,
                padding: 13,
                fontFamily: "Quicksand, sans-serif",
                fontWeight: 500,
                fontSize: 16,
                boxShadow: "0 0 3px 0px #f0f0f0"
              }}
            />
            <Box bg="primary" px={3} py={3} sx={{ borderRadius: "default" }}>
              <Flex flexDirection="row" justifyContent="space-between">
                <Text fontFamily="body" fontWeight="bold">
                  This is a note title
                </Text>
                <Flex flexDirection="row">
                  <Icon.Share2 size={20} strokeWidth={1.3} />
                  <Icon.Heart
                    size={20}
                    strokeWidth={1.3}
                    style={{ marginLeft: 5 }}
                  />
                  <Icon.MoreVertical size={20} strokeWidth={1.3} />
                </Flex>
              </Flex>
              <Text fontFamily="body" fontSize="body">
                You are born to be the greatest there ever was. Embrace your
                true powers!
              </Text>
            </Box>
          </Flex>
          <Editor />
        </Flex>
      </Flex>
    </ThemeProvider>
  );
}

export default App;
