const { useState, useEffect } = require("react");
const { getCurrentPath, NavigationEvents } = require("../navigation");

export default function useLocation() {
  const [location, setLocation] = useState(getCurrentPath());
  useEffect(() => {
    const navigateEvent = NavigationEvents.subscribe(
      "onNavigate",
      (_, location) => {
        setLocation(location);
      }
    );
    return () => {
      navigateEvent.unsubscribe();
    };
  }, []);
  return [location];
}
