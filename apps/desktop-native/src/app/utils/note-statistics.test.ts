import { describe, expect, test } from "vitest";
import { getNoteStatistics } from "./note-statistics";

describe("note statistics", () => {
  test("counts words, characters, paragraphs and spaces", () => {
    const stats = getNoteStatistics(
      "<p>Hello brave world</p><p>Second&nbsp;one</p>"
    );
    expect(stats.words.total).toBe(5);
    expect(stats.paragraphs.total).toBe(2);
    expect(stats.characters.total).toBe(
      "Hellobraveworld".length + "Second one".replace(/\s/g, "").length
    );
    expect(stats.spaces.total).toBe(4);
  });

  test("an empty note has no words", () => {
    expect(getNoteStatistics("<p></p>").words.total).toBe(0);
    expect(getNoteStatistics(undefined).paragraphs.total).toBe(0);
  });
});
