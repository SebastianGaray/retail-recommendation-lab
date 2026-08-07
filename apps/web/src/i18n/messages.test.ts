import { describe, expect, it } from "vitest";
import { getMessages } from "./messages";

describe("localized messages", () => {
  it("keeps matching, non-empty catalogs", () => {
    const english = getMessages("en");
    const spanish = getMessages("es");

    expect(Object.keys(spanish).sort()).toEqual(Object.keys(english).sort());
    expect(Object.values(english).every((value) => value.trim())).toBe(true);
    expect(Object.values(spanish).every((value) => value.trim())).toBe(true);
  });
});
