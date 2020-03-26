import { motion } from "framer-motion";
import React from "react";
import { Box, Flex, Text } from "rebass";
var parameters = {
  padding: "4px",
  margin: "3px",
  width: "170px",
  shadow: "primary",
  opacity: "0.5"
};

function NotesPlaceholder() {
  return (
    <>
      <Flex
        style={{
          position: "relative",
          width: "250px",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        {[
          {
            right: "0px",
            bottom: "-50px",
            opacity: "0.7",
            x: 2,
            y: 2,
            pos: "absolute"
          },
          {
            right: null,
            bottom: null,
            opacity: "0.9",
            x: -2,
            y: -2,
            pos: "relative"
          }
        ].map(item => (
          <motion.div
            style={{
              position: item.pos,
              left: item.right,
              marginTop: item.bottom,
              boxShadow: "2px 2px 15px 0px #00000060",
              borderRadius: "5px"
            }}
            animate={{
              x: item.x,
              y: item.y
            }}
            transition={{
              duration: 4,
              ease: "linear",
              yoyo: Infinity
            }}
          >
            <Flex
              className="home-animation"
              flexDirection="row"
              bg="#f0f0f0"
              opacity={item.opacity}
            >
              <Flex>
                <Box
                  width={1}
                  bg="primary"
                  sx={{ borderRadius: "25px" }}
                  px={parameters.padding}
                  height="100%"
                ></Box>
              </Flex>
              <Flex sx={{}} flexDirection="column" px="5px" py="5px">
                <Box
                  sx={{
                    fontFamily: "heading"
                  }}
                  color="primary"
                >
                  Title
                </Box>
                {[1, 2, 3, 4].map(item => (
                  <Box
                    opacity={parameters.opacity}
                    bg={parameters.shadow}
                    sx={{ borderRadius: "25px" }}
                    py={parameters.padding}
                    my={parameters.margin}
                    width={parameters.width}
                  ></Box>
                ))}

                <Flex flexDirection="row">
                  <Box
                    width={1 / 6}
                    py={parameters.padding}
                    my={parameters.margin}
                    sx={{ borderRadius: "25px" }}
                    bg="icon"
                  ></Box>
                  <Box
                    width={1 / 6}
                    height={1}
                    py={parameters.padding}
                    my={parameters.margin}
                    mx="10px"
                    sx={{ borderRadius: "25px" }}
                    bg="icon"
                  ></Box>
                </Flex>
              </Flex>
            </Flex>
          </motion.div>
        ))}
      </Flex>
      <Text
        color="gray"
        marginTop={50}
        alignSelf="center"
        sx={{
          textAlign: "center",
          fontSize: "title"
        }}
      >
        Notes you write appear here.
      </Text>
    </>
  );
}
export default NotesPlaceholder;
