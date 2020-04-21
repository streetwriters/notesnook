import React from "react";
import { Box, Button, Flex, Text } from "rebass";
import * as Icon from "../components/icons";
import { useStore as useUserStore } from "../stores/user-store";
import { useStore as useThemeStore } from "../stores/theme-store";
import AccentItem from "../components/accent-item";
import accents from "../theme/accents";

function Settings(props) {
  const theme = useThemeStore((store) => store.theme);
  const toggleNightMode = useThemeStore((store) => store.toggleNightMode);
  const user = useUserStore((store) => store.user);
  const isLoggedIn = useUserStore((store) => store.isLoggedIn);

  return (
    <Flex variant="columnFill" mx={2}>
      <Flex
        bg="shade"
        p={2}
        sx={{ borderRadius: "default", cursor: "pointer" }}
        onClick={() => props.navigator.navigate("account")}
      >
        <Flex
          variant="columnCenter"
          bg="primary"
          mr={2}
          size={40}
          sx={{
            borderRadius: 80,
          }}
        >
          <Icon.User color="static" />
        </Flex>
        <Flex variant="columnCenter" alignItems="flex-start">
          {isLoggedIn ? (
            <>
              <Text variant="title">{user.username}</Text>
              <Text variant="subBody">{user.email}</Text>
            </>
          ) : (
            <>
              <Text variant="subBody">You are not logged in</Text>
              <Text variant="body" color="primary">
                Login to sync notes.
              </Text>
            </>
          )}
        </Flex>
      </Flex>
      <Text my={2} variant="title" color="primary">
        Appearance
      </Text>
      <Box
        sx={{
          borderBottom: "1px Solid",
          borderColor: "border",
          ":hover": { borderColor: "primary" },
        }}
      >
        <Flex
          flexWrap="wrap"
          justifyContent="left"
          mb={2}
          p={1}
          bg="shade"
          sx={{
            borderRadius: "default",
          }}
        >
          {accents.map((color) => (
            <AccentItem
              key={color.code}
              code={color.code}
              label={color.label}
            />
          ))}
        </Flex>
        <Flex
          justifyContent="space-between"
          alignItems="center"
          onClick={() => toggleNightMode()}
          py={2}
        >
          <Text color="text" fontSize="body">
            Dark Mode
          </Text>
          {theme === "dark" ? <Icon.Check /> : <Icon.CircleEmpty />}
        </Flex>
      </Box>
      <Text my={2} variant="title" color="primary">
        Other
      </Text>
      {["Terms of Service", "Privacy Policy", "About"].map((title) => (
        <Button
          key={title}
          variant="list"
          onClick={() =>
            props.navigator.navigate("TOS", {
              title,
            })
          }
        >
          {title}
        </Button>
      ))}
    </Flex>
  );
}

export default Settings;
