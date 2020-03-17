import { motion } from "framer-motion";
import React from "react";
import * as Icon from "../icons";
import { Flex, Text } from "rebass";

const FavoritesPlaceholder = props => {
  return (
    <>
      <Flex
        style={{
          position: "relative",
          height: "100px",
          alignSelf: "center",
          flexDirection: "row"
        }}
      >
        {[
          { delay: 3, marginTop: "10px", size: 25 },
          { delay: 8, marginTop: "20px", size: 25 },
          { delay: 12, marginTop: "-30px", size: 25 },
          { delay: 10, marginTop: "0px", size: 30 },
          { delay: 7, marginTop: "-30px", size: 25 },
          { delay: 2, marginTop: "20px", size: 25 },
          { delay: 4, marginTop: "10px", size: 25 }
        ].map(item => (
          <motion.div
            style={{
              padding: 0,
              margin: 0,
              marginTop: item.marginTop,
              position: "relative"
            }}
            animate={{
              opacity: [0.1, 0.5, 1, 0.5, 0],
              scaleX: [0.7, 0.75, 0.85, 0.9, 1],
              scaleY: [0.7, 0.75, 0.85, 0.9, 1]
            }}
            transition={{
              duration: 7,
              ease: "linear",
              delay: item.delay,
              loop: Infinity
            }}
          >
            <Icon.Star color="favorite" size={item.size} />
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
        Notes you favorite appear here.
      </Text>
    </>
  );
};

export default FavoritesPlaceholder;
