import React from "react";
import Fav from "../../assets/fav.svg";
import Placeholder from "./index";

function FavoritesPlaceholder() {
  return (
    <Placeholder
      image={Fav}
      title="Your favorites"
      text="Notes you favorite will appear here."
    />
  );
}
export default FavoritesPlaceholder;
