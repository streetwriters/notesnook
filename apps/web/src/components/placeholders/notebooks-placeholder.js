import { motion } from "framer-motion";
import React from "react";
import { Box, Flex, Text } from "rebass";

const NotebooksPlaceholder = props => {
  return (
    <>
      <Flex
        style={{
          width: "300px",
          position: "relative",
          alignSelf: "center",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <motion.div
          animate={{
            x: 2,
            y: 2
          }}
          style={{
            position: "absolute",
            bottom: "50px",
            right: "120px",
            zIndex: 999
          }}
          transition={{
            duration: 4,
            ease: "linear",
            yoyo: Infinity
          }}
        >
          <Box
            style={{
              width: "130px",
              backgroundColor: "#c9c9c9",
              height: "150px",
              borderRadius: "5px",
              boxShadow: "2px 2px 15px 0px #00000040"
            }}
          >
            <Flex
              backgroundColor="primary"
              opacity={1}
              sx={{
                borderRadius: "5px",
                boxShadow: "1px 1px 5px 0px #00000060",
                height: "150px",
                width: "120px",
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "column"
              }}
            >
              <Box
                style={{
                  height: 10,
                  width: "120px",
                  backgroundColor: "white",
                  marginBottom: "20px",
                  top: 15
                }}
              ></Box>
              <Text
                color="white"
                fontSize={14}
                fontFamily="heading"
                textAlign="center"
                px={1}
              >
                My Notebook
                <Text color="white" fontSize={11}>
                  Keep it all organized
                </Text>
              </Text>
            </Flex>
          </Box>
        </motion.div>

        <motion.div
          animate={{
            x: -2,
            y: -2
          }}
          transition={{
            duration: 4,
            ease: "linear",
            yoyo: Infinity
          }}
        >
          <Box
            style={{
              width: "130px",
              backgroundColor: "#c9c9c9",
              height: "150px",
              borderRadius: "5px",
              boxShadow: "2px 2px 15px 0px #00000040"
            }}
          >
            <Flex
              backgroundColor="primary"
              opacity={0.5}
              sx={{
                borderRadius: "5px",
                boxShadow: "1px 1px 5px 0px #00000060",
                height: "150px",
                width: "120px",
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "column"
              }}
            >
              <Box
                style={{
                  height: 10,
                  width: "120px",
                  backgroundColor: "white",
                  marginBottom: "20px",
                  top: 15
                }}
              ></Box>
              <Text
                color="white"
                fontSize={14}
                fontFamily="heading"
                textAlign="center"
                px={1}
              >
                My Notebook
                <Text color="white" fontSize={11}>
                  Keep it flowing
                </Text>
              </Text>
            </Flex>
          </Box>
        </motion.div>
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
        Notebooks you add will appear here.
      </Text>
    </>
  );
};

export default NotebooksPlaceholder;
