import { useState, useEffect } from "react";
import { hashNavigate } from "../navigation";

// returns the current hash location in a normalized form
// (excluding the leading '#' symbol)
const currentLocation = () => {
  const location = window.location.hash.replace(/^#/, "") || "/";
  let end: number | undefined = location.indexOf("?");
  if (end <= -1) end = undefined;
  return location.substring(0, end);
};

const currentQuery = () => {
  const location = window.location.hash.replace(/^#/, "") || "/";
  return Object.fromEntries(
    new URLSearchParams(location.substring(location.indexOf("?"))).entries()
  );
};

type HashLocation = { location: string; update: boolean };
export default function useHashLocation() {
  const [loc, setLoc] = useState<HashLocation>({
    location: currentLocation(),
    update: true
  });
  const [queryParams, setQueryParams] = useState(currentQuery());

  useEffect(() => {
    // this function is called whenever the hash changes
    const handler = (e: HashChangeEvent) => {
      const update = (e as any).notify === undefined ? true : (e as any).notify;
      console.log(currentLocation());
      setLoc({
        location: currentLocation(),
        update
      });
      setQueryParams(currentQuery());
    };

    // subscribe to hash changes
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  return [loc, queryParams, hashNavigate] as const;
}
