import { m as motion } from "framer-motion";
import { Flex, Box, Image, Text } from "rebass";
import { Input } from "@rebass/forms";

const Animated = {
  Flex: motion.custom(Flex),
  Box: motion.custom(Box),
  Image: motion.custom(Image),
  Text: motion.custom(Text),
  Input: motion.custom(Input),
};
export default Animated;
