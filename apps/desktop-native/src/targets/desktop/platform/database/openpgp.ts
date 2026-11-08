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

import OpenPGPModule from "@react-native-gpui/openpgp";

interface OpenPGP {
  generate(options: {
    name: string;
    email: string;
  }): Promise<{ publicKey: string; privateKey: string }>;
  encrypt(message: string, publicKey: string): Promise<string>;
  decrypt(
    message: string,
    privateKey: string,
    passphrase: string
  ): Promise<string>;
}

export default OpenPGPModule as unknown as OpenPGP;
