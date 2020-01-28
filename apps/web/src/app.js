import React, { useState, useEffect } from "react";
import "./app.css";
import Editor from "./components/editor";
import { Flex, Box, Button } from "rebass";
import { ThemeProvider } from "./utils/theme";
import RootNavigator from "./navigation/navigators/rootnavigator";
import "./app.css";

const NavMenuItem = props => {
  return (
    <Button
      onClick={props.onSelected}
      variant="nav"
      sx={{
        width: "full",
        borderRadius: "none",
        textAlign: "center",
        color: props.selected ? "primary" : props.item.color || "text",
        ":hover": {
          backgroundColor: "shade"
        }
      }}
      px={0}
    >
      <props.item.icon
        size={25}
        strokeWidth={props.selected ? 2 : 1.3}
        style={{ marginRight: 3 }}
        fill={props.item.color || "transparent"}
      />
      {/*  <Text sx={{ fontSize: 15, marginLeft: 1 }}>{props.item.title}</Text> */}
    </Button>
  );
};

var startX, startWidth;
function getNavigationViewWidth() {
  return window.localStorage.getItem("navigationViewWidth");
}
function App() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hideNavigationView, setHideNavigationView] = useState(false);
  useEffect(() => {
    RootNavigator.navigate("home");
  }, []);
  return (
    <ThemeProvider>
      <Flex
        bg="background"
        sx={{ color: "text" }}
        height="100%"
        alignContent="stretch"
      >
        <Box
          sx={{
            borderRight: "1px solid",
            borderRightColor: "border",
            minWidth: 70,
            maxWidth: 70
          }}
          px={0}
        >
          {Object.values(RootNavigator.routes).map((item, index) => (
            <NavMenuItem
              onSelected={async () => {
                if (item.onClick) {
                  return item.onClick();
                }
                if (selectedIndex === index) {
                  setHideNavigationView(!hideNavigationView);
                  return;
                }
                if (RootNavigator.navigate(item.key)) {
                  setSelectedIndex(index);
                }
              }}
              key={item.key}
              item={item}
              selected={selectedIndex === index}
            />
          ))}
        </Box>
        <Flex flex="1 1 auto" flexDirection="row" alignContent="stretch" px={0}>
          <Flex
            className="RootNavigator"
            style={{
              display: hideNavigationView ? "none" : "flex"
            }}
            sx={{
              borderRight: "1px solid",
              borderColor: "border",
              width: !getNavigationViewWidth()
                ? ["100%", "40%", "23%"]
                : getNavigationViewWidth()
            }}
            flexDirection="column"
            flex="1 1 auto"
            //style={{ width: "362px" }}
          />
          {!hideNavigationView && (
            <Box
              className="resize-handle"
              bg="border"
              sx={{
                width: 5,
                opacity: 0,
                cursor: "col-resize"
              }}
              draggable={true}
              onMouseDown={e => {
                startX = e.clientX;
                let view = document
                  .querySelector(".RootNavigator")
                  .getBoundingClientRect();
                startWidth = parseInt(view.width, 10);
              }}
              onDrag={e => {
                let view = document.querySelector(".RootNavigator");
                view.style.width = `${startWidth + e.clientX - startX}px`;
              }}
              onDragEnd={e => {
                let view = document.querySelector(".RootNavigator");
                view.style.width = view.getBoundingClientRect().width;
                window.localStorage.setItem(
                  "navigationViewWidth",
                  view.style.width
                );
              }}
            />
          )}
          <Editor />
        </Flex>
        <Box id="dialogContainer" />
        <Box id="snackbarContainer" />
      </Flex>
    </ThemeProvider>
  );
}

export default App;
