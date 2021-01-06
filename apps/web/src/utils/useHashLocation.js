import { useState, useEffect } from "react";
import { hashNavigate } from "../navigation";

// returns the current hash location in a normalized form
// (excluding the leading '#' symbol)
const currentLocation = () => {
  return window.location.hash.replace(/^#/, "") || "/";
};

export default function useHashLocation() {
  const [loc, setLoc] = useState(currentLocation());

  useEffect(() => {
    // this function is called whenever the hash changes
    const handler = () => {
      setLoc(currentLocation());
    };

    // subscribe to hash changes
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  return [loc, hashNavigate];
}
