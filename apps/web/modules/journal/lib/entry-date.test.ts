import { describe, expect, it } from "vitest";

import { buildCreatedAt, toDateInputValue } from "./entry-date";

describe("toDateInputValue", () => {
	it("formats a local date as YYYY-MM-DD with zero padding", () => {
		expect(toDateInputValue(new Date(2026, 5, 8, 14, 30))).toBe("2026-06-08");
	});
});

describe("buildCreatedAt", () => {
	it("files the entry under the picked day while keeping the base time", () => {
		const base = new Date(2026, 5, 28, 0, 30, 15); // 00:30 on the new day
		const result = buildCreatedAt("2026-06-27", base);
		expect(result).toBeInstanceOf(Date);
		expect(result?.getFullYear()).toBe(2026);
		expect(result?.getMonth()).toBe(5); // June (0-indexed)
		expect(result?.getDate()).toBe(27);
		expect(result?.getHours()).toBe(0);
		expect(result?.getMinutes()).toBe(30);
		expect(result?.getSeconds()).toBe(15);
	});

	it("returns undefined for an empty or malformed value", () => {
		expect(buildCreatedAt("")).toBeUndefined();
		expect(buildCreatedAt("not-a-date")).toBeUndefined();
	});
});
