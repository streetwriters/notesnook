import { ThemeProvider } from "./components/theme-provider";
import { useAppStore } from "./stores/app-store";
import { Login } from "./views/login";
import { Main } from "./views/main";

export function App() {
  const isLoggedIn = useAppStore((s) => s.isLoggedIn);
  const user = useAppStore((s) => s.user);

  return (
    <ThemeProvider accent={user?.accent} theme={user?.theme}>
      {(() => {
        if (!isLoggedIn) return <Login />;
        return <Main />;
      })()}
    </ThemeProvider>
  );
}
