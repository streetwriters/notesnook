import React, { useState } from "react";
import "./app.css";
import Editor from "./Components/Editor";
import { ThemeProvider } from "emotion-theming";
import { Flex, Box, Text, Button, Card, Heading } from "rebass";
import { Input } from "@rebass/forms";
import * as Icon from "react-feather";
import theme, { SHADOW } from "./theme";

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
        <Box width={[0, 0, 70]} bg="navbg" px={0}>
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
            bg="primary"
            flexDirection="column"
            flex="1 1 auto"
            px={3}
            py={3}
            width={["100%", "40%", "13%"]}
          >
            <Heading fontSize="heading">Notes</Heading>
            <Input
              placeholder="Search"
              fontFamily="body"
              fontWeight="body"
              fontSize="input"
              bg="navbg"
              my={2}
              px={3}
              py={3}
              sx={{
                boxShadow: SHADOW,
                borderWidth: 0,
                borderRadius: "default"
              }}
            />
            <Box
              bg="navbg"
              my={2}
              px={3}
              py={3}
              sx={{ borderRadius: "default" }}
            >
              <Flex flexDirection="row" justifyContent="space-between">
                <Text fontFamily="body" fontSize="title" fontWeight="bold">
                  This is a note title
                </Text>
                <Flex flexDirection="row">
                  <Icon.Share2 size={20} strokeWidth={1.5} />
                  <Icon.Heart
                    size={20}
                    strokeWidth={1.5}
                    style={{ marginLeft: 15, marginRight: 10 }}
                  />
                  <Icon.MoreVertical size={20} strokeWidth={1.5} />
                </Flex>
              </Flex>
              <Text fontFamily="body" fontSize="body" sx={{ marginTop: 1 }}>
                You are born to be the greatest there ever was. Embrace your
                true powers!
              </Text>
              <Text
                fontFamily="body"
                fontWeight="body"
                fontSize={12}
                color="accent"
              >
                5 hours ago
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
