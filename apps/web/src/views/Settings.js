import React, { useState, useEffect } from 'react';
import { Box, Button, Flex, Text } from "rebass";
import { db } from "../common";
import Search from "../components/search";
import * as Icon from "react-feather";
import { Virtuoso as List } from "react-virtuoso";
import {Switch} from '@rebass/forms';
import "../app.css";



function Settings(){
    
  const [check, setCheck] = useState(false);

    return(
        <Flex flexDirection="column" flex="1 1 auto">
        <Flex flexDirection="column" flex="1 1 auto">
      <Button className="unselectable" variant="setting">
        General
      </Button>
      <Button className="unselectable" variant="setting">
        Account
      </Button>
      <Box
        sx={{
          borderLeft: "0px Solid",
          borderRight: "0px Solid",
          borderTop: "0px Solid",
          borderBottom: "1px Solid",
          borderColor: "border"
        }}
        py='15px'
      >
        <Flex
          className="unselectable"
          fontSize="body"
          alignItems="center"
        >
          <Text  px='16px'  sx={{ fontFamily: "body", fontSize: "title" }}>
            Theme
          </Text>
        </Flex>

        <Flex  flexDirection='column' justifyContent='center' mx='7%'>
        <Flex
          flexWrap="wrap"
          sx={{ marginBottom: 2 }}
          justifyContent="left"
        >
          {[
            { label: "red", code: "#ed2d37" },
            { label: "orange", code: "#ec6e05" },
            { label: "yellow", code: "yellow" },
            { label: "green", code: "green" },
            { label: "blue", code: "blue" },
            { label: "purple", code: "purple" },
            { label: "gray", code: "gray" },
            { label: "lightblue", code: "#46F0F0" },
            { label: "indigo", code: "#F032E6" },
            { label: "lightpink", code: "#FABEBE" }
          ].map(color => (
            <Box sx={{ cursor: "pointer" }}>
              <Icon.Circle size={50} fill={color.code} strokeWidth={0} />
            </Box>
          ))}
        </Flex>
        <Flex flexDirection="row" justifyContent="center">
          <Text  width={1 / 2} >
            Dark Mode
          </Text>{" "}
          <Flex width={1 / 2} justifyContent="right" >
            <Switch  className="unselectable" onClick={()=>{ setCheck(!check);}} checked={check}/>
          </Flex>
        </Flex>
        </Flex>
      </Box>
      <Button className="unselectable" variant="setting">
        Terms of Service
      </Button>
      <Button className="unselectable" variant="setting">
        Privacy Policy
      </Button>
      <Button className="unselectable" variant="setting">
        About
      </Button>
    
          </Flex>
      </Flex>
    );
}

export default Settings;