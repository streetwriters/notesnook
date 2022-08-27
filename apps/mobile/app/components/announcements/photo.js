import { Image } from "react-native";
import { getStyle } from "./functions";

export const Photo = ({ src, style = {} }) => {
  return src ? (
    <Image
      source={{ uri: src }}
      resizeMode="cover"
      style={{
        width: "100%",
        height: 200,
        alignSelf: "center",
        ...getStyle(style)
      }}
    />
  ) : null;
};
