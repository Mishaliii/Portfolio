import { describe, expect, it } from "vitest";
import { journey } from "@/content";
import { getShortestPath } from "./PageJourney";

describe("PageJourney unit tests", () => {
  describe("getShortestPath dial rolling logic", () => {
    it("returns single item when from === to", () => {
      expect(getShortestPath(2, 2)).toEqual([2]);
      expect(getShortestPath(0, 0)).toEqual([0]);
    });

    it("rolls forward for positive difference <= 5", () => {
      // 2021 -> 2024: rolls last digit 1 -> 4
      expect(getShortestPath(1, 4)).toEqual([1, 2, 3, 4]);
      // 2024 -> 2026: rolls last digit 4 -> 6
      expect(getShortestPath(4, 6)).toEqual([4, 5, 6]);
    });

    it("rolls backward for negative difference <= 5", () => {
      // 2026 -> 2024: rolls 6 -> 4
      expect(getShortestPath(6, 4)).toEqual([6, 5, 4]);
      // 2024 -> 2021: rolls 4 -> 1
      expect(getShortestPath(4, 1)).toEqual([4, 3, 2, 1]);
    });

    it("wraps around 0-9 using shortest direction", () => {
      // 9 -> 1: shortest is +2 (9 -> 0 -> 1)
      expect(getShortestPath(9, 1)).toEqual([9, 0, 1]);
      // 1 -> 9: shortest is -2 (1 -> 0 -> 9)
      expect(getShortestPath(1, 9)).toEqual([1, 0, 9]);
    });
  });

  describe("focus-index to details mapping", () => {
    it("maps all 4 journey stops with complete and non-empty details", () => {
      const stops = journey.stops;
      expect(stops.length).toBe(4);

      // Stop 0: 2021
      expect(stops[0].year).toBe("2021");
      expect(stops[0].role).toBe("BCA");
      expect(stops[0].place).toBe("Musaliar College of Arts and Science");
      expect(stops[0].line.length).toBeGreaterThan(10);
      expect(stops[0].tag).toBe("Degree");

      // Stop 1: 2024
      expect(stops[1].year).toBe("2024");
      expect(stops[1].role).toBe("MCA · CGPA 8.33");
      expect(stops[1].place).toBe("TKM College of Engineering, Kollam");
      expect(stops[1].line.length).toBeGreaterThan(10);
      expect(stops[1].tag).toBe("Postgraduate");

      // Stop 2: 2026
      expect(stops[2].year).toBe("2026");
      expect(stops[2].role).toBe("AI / ML Intern, DDSS");
      expect(stops[2].place).toBe("Bluecast Technologies (Jan to Apr)");
      expect(stops[2].line.length).toBeGreaterThan(10);
      expect(stops[2].tag).toBe("Internship");

      // Stop 3: 2026
      expect(stops[3].year).toBe("2026");
      expect(stops[3].role).toBe("AI / ML Engineer");
      expect(stops[3].place).toBe("Open to work");
      expect(stops[3].line.length).toBeGreaterThan(10);
      expect(stops[3].tag).toBe("Available");
    });

    it("ensures year transitions between sequential stops only roll differing digits", () => {
      const stops = journey.stops;

      // 0 -> 1: 2021 to 2024
      const y0 = stops[0].year.split("");
      const y1 = stops[1].year.split("");
      const diff01 = y0.map((d, i) => d !== y1[i]);
      expect(diff01).toEqual([false, false, false, true]); // only last digit differs

      // 1 -> 2: 2024 to 2026
      const y2 = stops[2].year.split("");
      const diff12 = y1.map((d, i) => d !== y2[i]);
      expect(diff12).toEqual([false, false, false, true]); // only last digit differs

      // 2 -> 3: 2026 to 2026
      const y3 = stops[3].year.split("");
      const diff23 = y2.map((d, i) => d !== y3[i]);
      expect(diff23).toEqual([false, false, false, false]); // all digits identical
    });
  });
});

