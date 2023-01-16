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

import { Parser } from "htmlparser2";

export class HTMLRewriter {
  /**
   *
   * @param {{
   *  ontag?: (name: string, attr: string, pos: {start: number, end: number}) => false | {name: string, attr: string} | undefined
   * }} options
   */
  constructor(options = {}) {
    const { ontag } = options;
    /**
     * @private
     */
    this.transformed = "";

    /** @private */
    this.currentTag = null;

    /** @private */
    this.ignoreIndex = null;

    /**
     * @private
     */
    this.parser = new Parser(
      {
        onreset: () => {
          this.transformed = "";
        },
        oncomment: () => this.write("<!--"),
        oncommentend: () => this.write("-->"),
        onopentag: (name, attr) => {
          if (this.ignoreIndex !== null) {
            this.ignoreIndex++;
            return;
          }

          this.closeTag();

          if (ontag) {
            const result = ontag(name, attr, {
              start: this.parser.startIndex,
              end: this.parser.endIndex
            });

            if (result === false) {
              this.ignoreIndex = 0;
              return;
            } else if (result) {
              name = result.name;
              attr = result.attr;
            }
          }

          this.write(`<${name}`);
          if (attr) {
            for (const key in attr) {
              if (!key) continue;
              this.write(` ${key}="${attr[key]}"`);
            }
          }
          this.currentTag = name;
        },
        onclosetag: (name, isImplied) => {
          if (this.ignoreIndex === 0) {
            this.ignoreIndex = null;
            return;
          }

          if (this.ignoreIndex !== null) {
            this.ignoreIndex--;
            return;
          }

          if (!isImplied) this.closeTag();

          this.write(isImplied ? "/>" : `</${name}>`);

          if (this.currentTag) {
            this.currentTag = null;
          }
        },
        ontext: (data) => {
          if (this.ignoreIndex !== null) {
            return;
          }

          this.closeTag();

          this.write(data);
        }
      },
      {
        recognizeSelfClosing: true,
        xmlMode: false,
        decodeEntities: false,
        lowerCaseAttributeNames: false,
        lowerCaseTags: false,
        recognizeCDATA: false
      }
    );
  }

  /**
   * @private
   */
  closeTag() {
    if (this.currentTag) {
      this.write(">");
      this.currentTag = null;
    }
  }

  transform(html) {
    this.parser.end(html);
    return this.transformed;
  }

  end() {
    this.parser.reset();
  }

  /**
   * @private
   */
  write(html) {
    this.transformed += html;
  }
}

export class HTMLParser {
  /**
   *
   * @param {{
   *  ontag?: (name: string, attr: Record<string, string>, pos: {start: number, end: number}) => void
   * }} options
   */
  constructor(options = {}) {
    const { ontag } = options;

    /**
     * @private
     */
    this.parser = new Parser(
      {
        onopentag: (name, attr) =>
          ontag(name, attr, {
            start: this.parser.startIndex,
            end: this.parser.endIndex
          })
      },
      {
        recognizeSelfClosing: true,
        xmlMode: false,
        decodeEntities: false,
        lowerCaseAttributeNames: false,
        lowerCaseTags: false,
        recognizeCDATA: false
      }
    );
  }

  parse(html) {
    this.parser.end(html);
    this.parser.reset();
  }
}
