const { useState, useEffect } = require("react");
const { getCurrentPath, NavigationEvents } = require("../navigation");

export default function useLocation() {
  const [location, setLocation] = useState(getCurrentPath());
  const [previousLocation, setPreviousLocation] = useState();
  const [navigationState, setNavigationState] = useState();

  useEffect(() => {
    const navigateEvent = NavigationEvents.subscribe(
      "onNavigate",
      (_, currentLocation) => {
        setLocation((prev) => {
          setNavigationState(getNavigationState(currentLocation, prev));
          setPreviousLocation(prev);
          return currentLocation;
        });
      }
    );
    return () => {
      navigateEvent.unsubscribe();
    };
  }, []);
  return [location, previousLocation, navigationState];
}

function getNavigationState(currentLocation, previousLocation) {
  if (!previousLocation || !currentLocation) return "neutral";

  let currentLevels = currentLocation.split("/");
  let previousLevels = previousLocation.split("/");
  const isSameRoot = currentLevels[1] === previousLevels[1];
  return isSameRoot
    ? currentLevels.length > previousLevels.length
      ? "forward"
      : currentLevels.length < previousLevels.length
      ? "backward"
      : "same"
    : "neutral";
}
