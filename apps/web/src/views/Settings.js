import React, { useState, useEffect } from 'react';
import {Box, Flex, Text} from 'rebass';
import Button from "../components/button";
import { db } from "../common";
import Setting from '../components/settings';
import Search from "../components/search";
import * as Icon from "react-feather";
import { Virtuoso as List } from "react-virtuoso";



function Settings(){
    
    const [trash, setTrash] = useState([]);

    useEffect(() => {
        function onRefreshTrash() {
          setTrash(db.getTrash());
        }
        onRefreshTrash();
        //ev.addListener("refreshNotes", onRefreshNotes);
        // return () => {
        //   //ev.removeListener("refreshNotes", onRefreshNotes);
        // };
      }, []);

    return(
        <Flex flexDirection="column" flex="1 1 auto">
        {(<Flex flexDirection="column" flex="1 1 auto">
           <Setting></Setting>
          </Flex>
        )}
      </Flex>
    );
}

export default Settings;