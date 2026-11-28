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

import { describe, expect, test } from "vitest";
import {
  getKeyframes,
  keyframes,
  keyframesVersion,
  parseAnimation,
  parseTransition,
  registerStylesheet
} from "./style/css-motion";

// The stylesheet apps/web's Wrapped view writes in a <style> element.
const WRAPPED = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .not-a-keyframes-rule { color: red; }
  @keyframes scaleIn {
    0% { opacity: 0; transform: scale(0.8); }
    50%, 100% { opacity: 1; transform: scale(1); }
  }
`;

describe("keyframes from a stylesheet", () => {
  test("registers every @keyframes rule by name and skips other rules", () => {
    expect(registerStylesheet(WRAPPED)).toEqual([
      "fadeIn",
      "slideUp",
      "scaleIn"
    ]);
    expect(getKeyframes("fadeIn")).toEqual({
      from: { opacity: 0 },
      to: { opacity: 1 }
    });
    expect(getKeyframes("slideUp")).toEqual({
      from: { opacity: 0, transform: "translateY(30px)" },
      to: { opacity: 1, transform: "translateY(0)" }
    });
    expect(getKeyframes("scaleIn")).toEqual({
      "0%": { opacity: 0, transform: "scale(0.8)" },
      "50%": { opacity: 1, transform: "scale(1)" },
      "100%": { opacity: 1, transform: "scale(1)" }
    });
    expect(getKeyframes("not-a-keyframes-rule")).toBeUndefined();
  });

  test("the version changes only when a rule is new or different", () => {
    registerStylesheet(WRAPPED);
    const before = keyframesVersion();
    registerStylesheet(WRAPPED);
    expect(keyframesVersion()).toBe(before);
    registerStylesheet("@keyframes fadeIn { from { opacity: 0.5; } }");
    expect(keyframesVersion()).toBe(before + 1);
    registerStylesheet(WRAPPED);
  });

  test("a broken stylesheet registers what it can and does not throw", () => {
    expect(registerStylesheet("@keyframes broken { from { opacity: 0;")).toEqual(
      ["broken"]
    );
    expect(registerStylesheet("")).toEqual([]);
    expect(registerStylesheet("@keyframes { }")).toEqual([]);
  });
});

describe("the keyframes tag", () => {
  test("returns a name an animation string can use", () => {
    const spin = keyframes`
      from { transform: rotate(0deg); }
      to { transform: rotate(${360}deg); }
    `;
    expect(getKeyframes(spin)).toEqual({
      from: { transform: "rotate(0deg)" },
      to: { transform: "rotate(360deg)" }
    });
    expect(parseAnimation(`${spin} 1s linear infinite`)).toMatchObject({
      duration: 1000,
      easing: "linear",
      iterationCount: "infinite"
    });
  });

  test("the same rule gets the same name", () => {
    const a = keyframes`from { opacity: 0; } to { opacity: 1; }`;
    const b = keyframes`from { opacity: 0; } to { opacity: 1; }`;
    expect(a).toBe(b);
  });
});

describe("animation strings", () => {
  test("name, duration, easing, delay and fill mode, as in Wrapped", () => {
    registerStylesheet(WRAPPED);
    expect(parseAnimation("slideUp 1s ease-out 0.2s both")).toEqual({
      keyframes: getKeyframes("slideUp"),
      duration: 1000,
      delay: 200,
      easing: "ease-out",
      fillMode: "both"
    });
    expect(parseAnimation("fadeIn 0.8s ease-out")).toEqual({
      keyframes: getKeyframes("fadeIn"),
      duration: 800,
      easing: "ease-out"
    });
  });

  test("a name with no registered keyframes draws nothing", () => {
    expect(parseAnimation("unknownAnimation 1s ease")).toBeUndefined();
    expect(parseAnimation("")).toBeUndefined();
    expect(parseAnimation("none")).toBeUndefined();
  });

  test("the first registered animation of a list is used", () => {
    registerStylesheet(WRAPPED);
    expect(
      parseAnimation("unknownAnimation 1s, fadeIn 300ms 2 alternate")
    ).toEqual({
      keyframes: getKeyframes("fadeIn"),
      duration: 300,
      iterationCount: 2,
      direction: "alternate"
    });
  });
});

describe("transition strings", () => {
  test("a property desktop animates", () => {
    expect(parseTransition("opacity 0.2s ease-in-out")).toEqual({
      property: ["opacity"],
      duration: 200,
      delay: undefined,
      easing: "ease-in-out"
    });
    expect(parseTransition("background-color 100ms linear 50ms")).toEqual({
      property: ["backgroundColor"],
      duration: 100,
      delay: 50,
      easing: "linear"
    });
  });

  test("all is every property desktop animates", () => {
    expect(parseTransition("all 0.3s")?.property).toEqual([
      "opacity",
      "transform",
      "backgroundColor",
      "color",
      "borderColor"
    ]);
    expect(parseTransition("0.3s")?.duration).toBe(300);
  });

  test("a list keeps the drawable properties and drops the rest", () => {
    expect(
      parseTransition("width 0.2s, transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)")
    ).toEqual({
      property: ["transform"],
      duration: 400,
      delay: undefined,
      easing: "cubic-bezier(0.4, 0, 0.2, 1)"
    });
  });

  test("nothing drawable, or no duration, is no transition", () => {
    expect(parseTransition("width 0.2s ease")).toBeUndefined();
    expect(parseTransition("box-shadow 0.2s, height 1s")).toBeUndefined();
    expect(parseTransition("opacity")).toBeUndefined();
    expect(parseTransition("none")).toBeUndefined();
  });
});
