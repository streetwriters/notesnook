import React from "react";
import TimeAgo from "timeago-react";
import { db, ev } from "../../common";
import { showSnack } from "../snackbar";
import ListItem from "../list-item";
import { Virtuoso as List } from "react-virtuoso";
import {Box,Button} from 'rebass';
import '../../App.css'

const dropdownRefs = [];
const menuItems = [
  { title: "Restore" },
  {
    title: "Delete",
    color: "red",
  }
];

function sendOpenNoteEvent(note) {
  ev.emit("onOpenNote", note);
}

const Setting = () => {
  return (
    <>
   <Button className='unselectable' variant='setting'>General</Button>
   </>
  );
};

export default Setting;