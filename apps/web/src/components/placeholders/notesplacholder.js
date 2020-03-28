import React from "react";
import { Text, Flex, Box } from "rebass";
import Placeholder from "./index";
import * as Icon from "../icons";
import { getRandom } from "../../utils/random";

const colors = ["hover", "primary", "dimPrimary", "shade"];
const icons = [Icon.Vault, Icon.Pin, Icon.Star];
const titles = ["Assignment #4", "Git Workflow", "Project Aurora"];
const words = Array(25).fill(0);

function NotesPlaceholder() {
  return (
    <Placeholder
      items={titles}
      label="Notes you write will appear here"
      renderItem={(_, index) => {
        const Icon = icons[index];
        return (
          <Flex
            width="55%"
            bg="bgSecondary"
            opacity={0.9}
            mt={index && -50}
            ml={-40 + index * 60}
            sx={{
              boxShadow: "2px 2px 7px 0px #00000040",
              borderRadius: "default"
            }}
          >
            <Flex flex="1 1 auto" flexDirection="column" p={1}>
              <Flex alignItems="center" justifyContent="space-between">
                <Text variant="title" color="primary" mb={1}>
                  {titles[index]}
                </Text>
                <Icon size={20} color="dimPrimary" />
              </Flex>
              <Flex flexWrap="wrap">
                {words.map(() => (
                  <Box
                    width={getRandom(20, 50)}
                    py={"4px"}
                    mr={1}
                    my={"3px"}
                    sx={{ borderRadius: "25px" }}
                    bg={colors[getRandom(0, 3)]}
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
