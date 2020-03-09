import { motion } from "framer-motion";
import React from "react";
import { Flex, Text } from "rebass";

const animatedTags = [
  {
    delay: 3,
    marginTop: "-50px",
    size: 14,
    text: "presentations",
    left: "25px"
  },
  {
    delay: 12,
    marginTop: "20px",
    size: 16,
    text: "quotesonlife",
    left: "90px"
  },
  {
    delay: 18,
    marginTop: "-25px",
    size: 18,
    text: "workinprogress",
    left: "70px"
  },
  {
    delay: 24,
    marginTop: "0px",
    size: 14,
    text: "todolists",
    left: "35px"
  },
  {
    delay: 30,
    marginTop: "40px",
    size: 24,
    text: "myschoolwork",
    left: "50px"
  }
];

const TagsPlaceholder = props => {
  return (
    <>
      <Flex
        style={{
          width: "300px",
          position: "relative",
          height: "100px",
          alignSelf: "center",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        {animatedTags.map(item => (
          <motion.div
            style={{
              padding: 0,
              margin: 0,
              marginTop: item.marginTop,
              left: item.left,
              position: "absolute"
            }}
            animate={{
              opacity: [0.1, 0.5, 1, 0.5, 0],
              scaleX: [0.7, 0.75, 0.85, 0.9, 1],
              scaleY: [0.7, 0.75, 0.85, 0.9, 1]
            }}
            transition={{
              duration: 12,
              ease: "linear",
              delay: item.delay,
              loop: Infinity
            }}
          >
            <Text color="text" fontSize={item.size} as="span">
              <Text as="span" color="primary">
                #
              </Text>
              {item.text}
            </Text>
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
        Tags added to notes appear here.
      </Text>
    </>
  );
};

export default TagsPlaceholder;
