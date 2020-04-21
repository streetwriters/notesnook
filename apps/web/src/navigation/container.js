import React, { useEffect } from "react";
import { Flex } from "rebass";

function NavigationContainer(props) {
  useEffect(() => {
    props.navigator.onLoad();
  }, [props.navigator]);
  return <Flex className={props.navigator.root} variant="columnFill" />;
}
export default NavigationContainer;
