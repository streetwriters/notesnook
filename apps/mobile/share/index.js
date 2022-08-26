import React, { Fragment } from "react";
import { Modal, Platform } from "react-native";
import ShareView from "./share";
const Wrapper = Platform.OS === "android" ? Modal : Fragment;
const outerProps =
  Platform.OS === "android"
    ? {
        animationType: "fade",
        transparent: true,
        visible: true
      }
    : {};
const NotesnookShare = ({ quicknote = false }) => {
  return (
    <Wrapper {...outerProps}>
      <ShareView quicknote={quicknote} />
    </Wrapper>
  );
};

export default NotesnookShare;
