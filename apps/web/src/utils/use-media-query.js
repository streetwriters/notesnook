/* eslint-disable react-hooks/rules-of-hooks */
import { useState, useEffect } from "react";

const errorMessage =
  "matchMedia is not supported, this could happen both because window.matchMedia is not supported by" +
  " your current browser or you're using the useMediaQuery hook whilst server side rendering.";

/**
 * Accepts a media query string then uses the
 * [window.matchMedia](https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia) API to determine if it
 * matches with the current document.<br />
 * It also monitor the document changes to detect when it matches or stops matching the media query.<br />
 * Returns the validity state of the given media query.
 *
 */
const useMediaQuery = (mediaQuery) => {
  if (!window.matchMedia) {
    // eslint-disable-next-line no-console
    console.warn(errorMessage);
    return null;
  }

  const [isVerified, setIsVerified] = useState(
    !!window.matchMedia(mediaQuery).matches
  );

  useEffect(() => {
    const mediaQueryList = window.matchMedia(mediaQuery);
    const documentChangeHandler = () => setIsVerified(!!mediaQueryList.matches);

    if (mediaQueryList.addEventListener)
      mediaQueryList.addEventListener("change", documentChangeHandler);
    else mediaQueryList.addListener(documentChangeHandler);

    documentChangeHandler();
    return () => {
      if (mediaQueryList.removeEventListener)
        mediaQueryList.removeEventListener("change", documentChangeHandler);
      else mediaQueryList.removeListener(documentChangeHandler);
    };
  }, [mediaQuery]);

  return isVerified;
};

export default useMediaQuery;
