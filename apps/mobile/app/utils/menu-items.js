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
export const MenuItemsList = [
  {
    name: "Notes",
    icon: "home-variant-outline",
    close: true
  },
  {
    name: "Notebooks",
    icon: "book-outline",
    close: true
  },
  {
    name: "Favorites",
    icon: "star-outline",
    close: true
  },
  {
    name: "Tags",
    icon: "pound",
    close: true
  },
  {
    name: "Reminders",
    icon: "bell",
    close: true,
    isBeta: true
  },
  {
    name: "Monographs",
    icon: "text-box-multiple-outline",
    close: true,
    func: () => {
      const Monographs = require("../screens/notes/monographs").Monographs;
      Monographs.navigate();
    }
  },
  {
    name: "Trash",
    icon: "delete-outline",
    close: true
  }
];
