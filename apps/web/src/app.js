import React, { useState, useEffect } from "react";
import "./app.css";
import Editor from "./components/editor";
import { ThemeProvider } from "emotion-theming";
import { Flex, Box, Button, Text } from "rebass";
import { Input } from "@rebass/forms";
import theme from "./theme";
import { routes, navigate } from "./navigation";
import CheckBox from "./components/checkbox";
import * as Icon from "react-feather";

const NavMenuItem = props => {
  useEffect(() => {
    if (props.selected) {
      navigate(props.item.key);
    }
  }, []);
  return (
    <Button
      onClick={props.onSelected}
      variant="nav"
      sx={{
        width: "full",
        borderRadius: "none",
        textAlign: "center",
        color: props.selected ? "primary" : "text"
      }}
      px={0}
    >
      <props.item.icon
        size={25}
        strokeWidth={props.selected ? 2 : 1.3}
        style={{ marginRight: 3 }}
      />
      {/*  <Text sx={{ fontSize: 15, marginLeft: 1 }}>{props.item.title}</Text> */}
    </Button>
  );
};

function App() {
  const [selectedIndex, setSelectedIndex] = useState(1);
  return (
    <ThemeProvider theme={theme}>
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
          {Object.values(routes).map((item, index) => (
            <NavMenuItem
              onSelected={() => {
                if (navigate(item.key)) {
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
            className="navigationView"
            sx={{
              borderRight: "1px solid",
              borderColor: "border"
            }}
            flexDirection="column"
            flex="1 1 auto"
            px={2}
            py={2}
            width={["100%", "40%", "15%"]}
          />
          <Editor />
          <Flex
            sx={{ borderLeft: "1px solid", borderColor: "border" }}
            flexDirection="column"
            bg="#1790F307"
            flex="1 1 auto"
            px={2}
            py={2}
            width={["0%", "0%", "10%"]}
          >
            <Text variant="title" color="primary" my={2}>
              Properties
            </Text>
            <CheckBox icon={Icon.MapPin} label="Pin" />
            <CheckBox icon={Icon.Star} label="Favorite" />
            <CheckBox icon={Icon.Lock} label="Lock" />
            <Flex
              className="unselectable"
              fontSize="body"
              sx={{ marginBottom: 2 }}
              alignItems="center"
            >
              <Icon.Tag size={18} />
              <Text sx={{ marginLeft: 1 }}>Tags:</Text>
            </Flex>
            <Input sx={{ marginBottom: 2 }} variant="default" />
            <Flex
              className="unselectable"
              fontSize="body"
              sx={{ marginBottom: 2 }}
              alignItems="center"
            >
              <Icon.Octagon size={18} />
              <Text sx={{ marginLeft: 1 }}>Colors:</Text>
            </Flex>
            <Flex flexWrap="wrap" sx={{ marginBottom: 2 }}>
              {[
                { label: "red", code: "#ed2d37" },
                { label: "orange", code: "#ec6e05" },
                { label: "yellow", code: "yellow" },
                { label: "green", code: "green" },
                { label: "blue", code: "blue" },
                { label: "purple", code: "purple" },
                { label: "gray", code: "gray" }
              ].map(color => (
                <Box sx={{ cursor: "pointer" }}>
                  <Icon.Circle size={40} fill={color.code} strokeWidth={0} />
                </Box>
              ))}
            </Flex>
          </Flex>
        </Flex>
        <Box id="snackbarContainer" />
      </Flex>
    </ThemeProvider>
  );
}

export default App;
