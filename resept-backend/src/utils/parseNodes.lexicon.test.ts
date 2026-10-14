import { containsUnitKeyword } from "./parseNodes.lexicon";

describe("containsUnitKeyword", () => {
  it("should detect units separated from the amount by a space", () => {
    expect(containsUnitKeyword("720 g cream cheese")).toBe(true);
    expect(containsUnitKeyword("Flaky sea salt 1 tsp")).toBe(true);
  });

  it("should detect units written directly after the amount", () => {
    expect(containsUnitKeyword("Cream cheese 720g")).toBe(true);
    expect(containsUnitKeyword("Double cream 400ml")).toBe(true);
    expect(containsUnitKeyword("500gr patentbloem")).toBe(true);
  });

  it("should not detect units inside regular words", () => {
    expect(containsUnitKeyword("Butter for greasing")).toBe(false);
    expect(containsUnitKeyword("Medium eggs 5")).toBe(false);
  });
});
