const { useEffect } = require("react");
const { NavigationEvents } = require("../navigation");

function useNavigate(routeKey, onNavigation) {
  useEffect(() => {
    onNavigation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onNavigate(route) {
      if (route?.key === routeKey) {
        onNavigation();
      }
    }
    NavigationEvents.subscribe("onNavigate", onNavigate);
    return () => {
      NavigationEvents.unsubscribe("onNavigate", onNavigate);
    };
  }, [routeKey, onNavigation]);
}
export default useNavigate;
