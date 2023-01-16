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

//https://www.electron.build/configuration/configuration#afterpack
exports.default = async function (context) {
  //console.log(context)
  var fs = require("fs");
  var localeDir = context.appOutDir + "/locales/";

  fs.readdir(localeDir, function (err, files) {
    //files is array of filenames (basename form)
    if (!(files && files.length)) return;
    for (var i = 0, len = files.length; i < len; i++) {
      var match = files[i].match(/en-US\.pak/);
      if (match === null) {
        fs.unlinkSync(localeDir + files[i]);
      }
    }
  });
};
