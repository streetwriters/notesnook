import React, { useEffect } from "react";
import { Flex, Box, Text, Heading } from "rebass";
import * as Icon from "react-feather";
import { SHADOW } from "../theme";
import { Input } from "@rebass/forms";
import Dropdown, {
  DropdownTrigger,
  DropdownContent
} from "react-simple-dropdown";
import "react-simple-dropdown/styles/Dropdown.css";

const menuItems = [
  { title: "Favorite", icon: Icon.Heart },
  { title: "Share", icon: Icon.Share2 },
  { title: "Delete", icon: Icon.Trash, color: "red" }
];
let notesMenu = undefined;

//TODO make this generic
function NoteMenu() {
  return (
    <Flex
      bg="primary"
      py={1}
      sx={{ borderRadius: "default", boxShadow: SHADOW }}
    >
      <Box>
        {menuItems.map(v => (
          <Flex
            onClick={() => notesMenu.hide()}
            flexDirection="row"
            alignItems="center"
            py={1}
            px={2}
            sx={{
              color: v.color || "fontPrimary",
              ":hover": {
                backgroundColor: "accent",
                color: "fontSecondary"
              }
            }}
          >
            <v.icon size={15} strokeWidth={1.5} />
            <Text
              className="unselectable"
              as="span"
              mx={1}
              fontFamily="body"
              fontSize="menu"
            >
              {v.title}
            </Text>
          </Flex>
        ))}
      </Box>
    </Flex>
  );
}

function Home() {
  return (
    <Box>
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
      <Box bg="navbg" px={3} py={3} sx={{ borderRadius: "default" }}>
        <Flex flexDirection="row" justifyContent="space-between">
          <Text fontFamily="body" fontSize="title" fontWeight="bold">
            This is a note title
          </Text>
          <Dropdown ref={ref => (notesMenu = ref)}>
            <DropdownTrigger>
              <Icon.MoreVertical
                size={20}
                strokeWidth={1.5}
                style={{ marginRight: -5 }}
              />
            </DropdownTrigger>
            <DropdownContent style={{ zIndex: 999, marginLeft: -70 }}>
              <NoteMenu />
            </DropdownContent>
          </Dropdown>
        </Flex>
        <Text fontFamily="body" fontSize="body" sx={{ marginTop: 1 }}>
          You are born to be the greatest there ever was. Embrace your true
          powers!
        </Text>
        <Text fontFamily="body" fontWeight="body" fontSize={12} color="accent">
          5 hours ago
        </Text>
      </Box>
    </Box>
  );
}

export default Home;
