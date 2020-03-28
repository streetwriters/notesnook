import React, { useState, useEffect } from "react";
import Animated from "../animated";
import { Text, Flex } from "rebass";
import { getRandom } from "../../utils/random";
import Placeholder from "./index";
import { useAnimation } from "framer-motion";

const tags = [
  "presentations",
  "quotesonlife",
  "workinprogress",
  "goodlife",
  "school",
  "lessons",
  "essays",
  "disasters",
  "todolists",
  "myschoolwork"
];

function TagsPlaceholder() {
  return (
    <Placeholder
      items={[0]}
      renderItem={() => (
        <Flex
          width={"80%"}
          opacity={0.9}
          alignItems="center"
          justifyContent="center"
          p={2}
          sx={{
            borderRadius: "default"
          }}
        >
          <Text fontSize={40} color="primary">
            #
          </Text>
          <TagSlider />
        </Flex>
      )}
    ></Placeholder>
  );
}
export default TagsPlaceholder;

function TagSlider() {
  const [tag, setTag] = useState(getRandomTag());
  const controls = useAnimation();
  useEffect(() => {
    animate(controls, setTag);
  }, [controls]);
  return (
    <Animated.Box
      initial={{ opacity: 0, y: -50 }}
      animate={controls}
      transition={{ duration: 0.4, ease: "easeOut" }}
      sx={{ fontSize: 40, color: "primary" }}
    >
      {tag}
    </Animated.Box>
  );
}

async function animate(controls, setTag) {
  await controls.start({ opacity: 1, y: 0 });
  await controls.start({
    opacity: 0,
    y: 50,
    transition: { delay: 1, duration: 0.4 }
  });
  await controls.start({
    opacity: 0,
    y: -50,
    transition: { duration: 0 }
  });
  setTag(getRandomTag());
  await animate(controls, setTag);
}

function getRandomTag() {
  return tags[getRandom(0, tags.length - 1)];
}
