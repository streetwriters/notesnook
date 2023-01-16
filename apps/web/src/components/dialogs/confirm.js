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

import { Box, Text } from "@theme-ui/components";
import Dialog from "./dialog";

function Confirm(props) {
  return (
    <Dialog
      isOpen={true}
      title={props.title}
      icon={props.icon}
      width={props.width}
      description={props.subtitle}
      onClose={props.onNo}
      positiveButton={
        props.yesText && {
          text: props.yesText,
          onClick: props.onYes,
          autoFocus: !!props.yesText
        }
      }
      negativeButton={
        props.noText && { text: props.noText, onClick: props.onNo }
      }
    >
      <Box pb={!props.noText && !props.yesText ? 2 : 0}>
        <Text as="span" variant="body">
          {props.message}
        </Text>
      </Box>
    </Dialog>
  );
}

export default Confirm;
