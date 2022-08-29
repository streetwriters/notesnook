import React from "react";
import { View } from "react-native";
const Seperator = ({ half = false }) => {
  return (
    <View
      style={{
        width: half ? 7.5 : 15,
        height: half ? 7.5 : 15
      }}
    />
  );
};

export default Seperator;
