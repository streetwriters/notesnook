import React, { useState, useEffect } from "react";
import { Box, Flex, Text } from "rebass";
import Button from "../components/button";
import { db, ev } from "../common";
import FavoriteItem from "../components/favorite";
import Search from "../components/search";
import * as Icon from "react-feather";
import { Virtuoso as List } from "react-virtuoso";

function Favorite() {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    function onRefreshFavorite() {
      setFavorites(db.getFavorites());
    }
    onRefreshFavorite();
    ev.addListener("refreshFavorite", onRefreshFavorite);
    return () => {
      ev.removeListener("refreshFavorite", onRefreshFavorite);
    };
  }, []);

  return (
    <Flex flexDirection="column" flex="1 1 auto">
      {favorites.length > 0 ? (
        <Flex flexDirection="column" flex="1 1 auto">
          <Search placeholder="Search" />
          <List
            style={{
              width: "100%",
              flex: "1 1 auto",
              height: "auto",
              overflowX: "hidden"
            }}
            totalCount={favorites.length}
            item={index => <FavoriteItem index={index} item={favorites[index]} />}
          />
          <Button
            Icon={Icon.Star}
            content={"Clear Favorite"}
            //onClick={}
          />
        </Flex>
      ) : (
        <Flex
          flex="1 1 auto"
          alignItems="center"
          justifyContent="center"
          color="#9b9b9b"
          flexDirection="column"
        >
          <Icon.Star size={72} strokeWidth={1.5} />
          <Text variant="title">You have no Favorites.</Text>
        </Flex>
      )}
    </Flex>
  );
}

export default Favorite;