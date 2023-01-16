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

import { useLayoutEffect } from "react";
import { ReactComponent as Note } from "../../assets/note2.svg";
import { ReactComponent as Notebook } from "../../assets/notebook.svg";
import { ReactComponent as Monographs } from "../../assets/monographs.svg";
import { ReactComponent as Search } from "../../assets/search.svg";
import { ReactComponent as Tag } from "../../assets/tag.svg";
import { ReactComponent as Trash } from "../../assets/trash.svg";
import { ReactComponent as Fav } from "../../assets/fav.svg";
import { ReactComponent as Attachment } from "../../assets/attachment.svg";
import { ReactComponent as Reminder } from "../../assets/reminder.svg";

const Placeholders = {
  note: Note,
  notebook: Notebook,
  topic: Notebook,
  monograph: Monographs,
  search: Search,
  tag: Tag,
  trash: Trash,
  favorites: Fav,
  attachments: Attachment,
  reminder: Reminder
};

export default function PlaceholderLoader({ name, onLoad, ...restProps }) {
  const Component = Placeholders[name];
  useLayoutEffect(() => {
    onLoad && onLoad();
  }, [onLoad]);

  if (!Component) return null;
  return <Component {...restProps} />;
}
