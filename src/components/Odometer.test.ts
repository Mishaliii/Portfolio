import { describe, it, expect } from "vitest";
import { parseOdometerValue } from "./Odometer";

describe("parseOdometerValue", () => {
  it("parses percentage strings with decimals correctly (e.g. 92.4%)", () => {
    const result = parseOdometerValue("92.4%");
    expect(result).toEqual([
      { type: "digit", value: 9 },
      { type: "digit", value: 2 },
      { type: "static", value: "." },
      { type: "digit", value: 4 },
      { type: "static", value: "%" },
    ]);
  });

  it("parses resolution strings with separators correctly (e.g. 224x224)", () => {
    const result = parseOdometerValue("224x224");
    expect(result).toEqual([
      { type: "digit", value: 2 },
      { type: "digit", value: 2 },
      { type: "digit", value: 4 },
      { type: "static", value: "x" },
      { type: "digit", value: 2 },
      { type: "digit", value: 2 },
      { type: "digit", value: 4 },
    ]);
  });

  it("parses comma-separated numbers correctly (e.g. 1,250)", () => {
    const result = parseOdometerValue("1,250");
    expect(result).toEqual([
      { type: "digit", value: 1 },
      { type: "static", value: "," },
      { type: "digit", value: 2 },
      { type: "digit", value: 5 },
      { type: "digit", value: 0 },
    ]);
  });

  it("parses single digit numbers and strings correctly (e.g. 3 and '3')", () => {
    expect(parseOdometerValue("3")).toEqual([{ type: "digit", value: 3 }]);
    expect(parseOdometerValue(3)).toEqual([{ type: "digit", value: 3 }]);
  });

  it("parses currency strings with prefix correctly (e.g. $12)", () => {
    const result = parseOdometerValue("$12");
    expect(result).toEqual([
      { type: "static", value: "$" },
      { type: "digit", value: 1 },
      { type: "digit", value: 2 },
    ]);
  });

  it("parses decimal numbers correctly (e.g. 0.5)", () => {
    const result = parseOdometerValue("0.5");
    expect(result).toEqual([
      { type: "digit", value: 0 },
      { type: "static", value: "." },
      { type: "digit", value: 5 },
    ]);
  });

  it("handles negative values or minus signs (e.g. -42)", () => {
    const result = parseOdometerValue("-42");
    expect(result).toEqual([
      { type: "static", value: "-" },
      { type: "digit", value: 4 },
      { type: "digit", value: 2 },
    ]);
  });
});
