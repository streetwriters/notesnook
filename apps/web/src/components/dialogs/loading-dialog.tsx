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
import { Box, Text } from "@theme-ui/components";
import Dialog from "./dialog";
import * as Icon from "../icons";

type LoadingDialogProps<T> = {
  onClose: (result: T | boolean) => void;
  action: () => T | Promise<T>;
  title: string;
  description: string;
  message?: string;
};

function LoadingDialog<T>(props: LoadingDialogProps<T>) {
  const { onClose, action, description, message, title } = props;
  useEffect(() => {
    (async function () {
      try {
        onClose(await action());
      } catch (e) {
        onClose(false);
        throw e;
      }
    })();
  }, [onClose, action]);

  return (
    <Dialog isOpen={true} title={title} description={description}>
      <Box>
        <Text as="span" variant="body">
          {message}
        </Text>
        <Icon.Loading rotate sx={{ my: 2 }} color="primary" />
      </Box>
    </Dialog>
  );
}
export default LoadingDialog;
