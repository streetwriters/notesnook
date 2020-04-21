import React from "react";
import { Text, Flex, Box } from "rebass";
import Placeholder from "./index";
import * as Icon from "../icons";

const icons = [Icon.Vault, Icon.Star];
const lines = Array(5).fill(0);

function NotesPlaceholder() {
  return (
    <Placeholder
      items={[0, 1]}
      renderItem={(_, index) => {
        const Icon = icons[index];
        return (
          <Flex
            key={"note-" + index}
            width="55%"
            bg="bgSecondary"
            opacity={0.9}
            mt={index && -50}
            ml={-40 + index * 60}
            sx={{
              boxShadow: "2px 2px 7px 0px #00000040",
              borderRadius: "default",
            }}
          >
            <Flex flex="0.06 1 auto" bg="primary" sx={{ borderRadius: 25 }} />
            <Flex flex="1 1 auto" flexDirection="column" p={1}>
              <Flex alignItems="center" justifyContent="space-between">
                <Text variant="title" color="primary" mb={1}>
                  Title
                </Text>
                <Icon size={20} color="dimPrimary" />
              </Flex>
              <Flex flexDirection="column">
                {lines.map((_, index) => (
                  <Box
                    key={index}
                    width={"100%"}
                    py={"4px"}
                    mr={1}
                    my={"3px"}
                    sx={{ borderRadius: "25px" }}
                    bg={"dimPrimary"}
                  />
                ))}
              </Flex>
            </Flex>
          </Flex>
        );
      }}
    />
  );
}
export default NotesPlaceholder;
