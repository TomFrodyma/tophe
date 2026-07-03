import { describe, expect, it } from "vitest";

import { polishNote } from "./greeting-format";

describe("polishNote", () => {
	it("turns an unspaced em dash into a comma pause", () => {
		expect(
			polishNote("grey skies notwithstanding—might be a good night to journal"),
		).toBe("Grey skies notwithstanding, might be a good night to journal");
	});

	it("turns spaced em/en dashes into a comma pause", () => {
		expect(polishNote("the day — clear and warm – invites a walk")).toBe(
			"The day, clear and warm, invites a walk",
		);
	});

	it("capitalises the first letter", () => {
		expect(polishNote("rainy and 12° out there.")).toBe("Rainy and 12° out there.");
	});

	it("doesn't touch hyphenated words", () => {
		expect(polishNote("a self-aware kind of morning")).toBe("A self-aware kind of morning");
	});

	it("avoids doubled commas when a dash follows a comma", () => {
		expect(polishNote("warm, —but breezy")).toBe("Warm, but breezy");
	});
});
