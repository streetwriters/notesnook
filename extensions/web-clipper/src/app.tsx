/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
import { useEffect } from "react";
import { ThemeProvider } from "./components/theme-provider";
import { useAppStore } from "./stores/app-store";
import { Login } from "./views/login";
import { Main } from "./views/main";
import { Settings } from "./views/settings";

export function App() {
  const isLoggedIn = useAppStore((s) => s.isLoggedIn);
  const user = useAppStore((s) => s.user);
  const route = useAppStore((s) => s.route);
  const navigate = useAppStore((s) => s.navigate);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
    } else navigate("/");
  }, [isLoggedIn]);

  return (
    <ThemeProvider accent={user?.accent} theme={user?.theme}>
      {(() => {
        switch (route) {
          case "/login":
            return <Login />;
          default:
          case "/":
            return <Main />;
          case "/settings":
            return <Settings />;
        }
      })()}
    </ThemeProvider>
  );
}
