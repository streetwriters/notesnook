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

import Dialog from "./dialog";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { Flex } from "@theme-ui/components";

export default function DialogLoader() {
  return (
    <Dialog
      isOpen={true}
      title={<Skeleton height={30} width={150} />}
      description={<Skeleton height={15} width={100} />}
    >
      <Skeleton height={200} />
      <Flex
        sx={{
          mb: 3,
          mt: 1,
          justifyContent: "flex-end",
          alignItems: "flex-end"
        }}
      >
        <Skeleton height={25} width={70} />
      </Flex>
    </Dialog>
  );
}
