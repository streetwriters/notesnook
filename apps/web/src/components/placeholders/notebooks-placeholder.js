import React from "react";
import { Box, Flex, Text } from "rebass";
import Placeholder from "./index";
import { getRandom } from "../../utils/random";

const titles = ["Yearbook 2020", "Semester 5", "Final Project", "Ready. Go"];
const descriptions = [
  "Thoughts & Stuff",
  "Ugh. Can't handle it anymore.",
  "Have to organize all this :(",
  "What the heck!"
];
function NotebooksPlaceholder() {
  return (
    <Placeholder
      items={[0, 1]}
      renderItem={item => (
        <Flex
          mt={-80 * item}
          ml={80 * item}
          opacity={!item ? 0.7 : 1}
          height="150px"
          sx={{
            zIndex: item,
            bg: "hover",
            borderRadius: "default",
            boxShadow: "2px 2px 7px 0px #00000040"
          }}
        >
          <Flex
            variant="columnCenter"
            bg="background"
            mr={2}
            width={120}
            sx={{
              borderRadius: "default",
              boxShadow: "1px 1px 5px 0px #00000060"
            }}
          >
            <Box m={3} height={10} width={"100%"} bg="primary" />
            <Text
              color="primary"
              fontSize={"body"}
              fontFamily="heading"
              textAlign="center"
              px={1}
            >
              {titles[getRandom(0, 3)]}
              <Text color="dimPrimary" wrap="wrap" fontSize="subBody">
                {descriptions[getRandom(0, 3)]}
              </Text>
            </Text>
          </Flex>
        </Flex>
      )}
    ></Placeholder>
  );
}
export default NotebooksPlaceholder;
