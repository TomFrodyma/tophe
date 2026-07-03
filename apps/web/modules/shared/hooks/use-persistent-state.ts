"use client";

import { useEffect, useState } from "react";

/**
 * useState that survives reloads via localStorage. Renders `initial` first and
 * restores the stored value after mount, so server and client HTML always match.
 * Per-device by design: view/sort preferences on the phone and desktop can differ.
 */
export function usePersistentState<T>(key: string, initial: T) {
	const [value, setValue] = useState<T>(initial);

	useEffect(() => {
		try {
			const raw = window.localStorage.getItem(key);
			if (raw !== null) setValue(JSON.parse(raw));
		} catch {
			// Corrupt entry: ignore and fall back to the default.
		}
	}, [key]);

	const setAndStore = (next: T) => {
		setValue(next);
		try {
			window.localStorage.setItem(key, JSON.stringify(next));
		} catch {
			// Storage full/blocked: state still works for this session.
		}
	};

	return [value, setAndStore] as const;
}
