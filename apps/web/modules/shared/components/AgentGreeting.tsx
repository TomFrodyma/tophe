"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

function instantHeadline(name: string): string {
	const hour = new Date().getHours();
	const greeting =
		hour >= 5 && hour < 12
			? "Good morning"
			: hour >= 12 && hour < 17
				? "Good afternoon"
				: hour >= 17 && hour < 22
					? "Good evening"
					: "Hello";
	return `${greeting}, ${name}.`;
}

/**
 * The start-page hero: a single agent-written line that's aware of the time,
 * date, weather, and any holiday.
 *
 * The headline renders instantly from local time (SSR-safe, no layout shift);
 * the personal note is generated server-side by the agent and fades in when it
 * lands. `loadingNote` keeps the second line meaningful until then.
 */
export function AgentGreeting({ name, loadingNote }: { name: string; loadingNote: string }) {
	const [headline, setHeadline] = useState(`Hello, ${name}.`);

	useEffect(() => {
		setHeadline(instantHeadline(name));
	}, [name]);

	const { data } = useQuery({
		...orpc.ai.greeting.queryOptions(),
		staleTime: 30 * 60 * 1000,
		refetchOnWindowFocus: false,
	});

	const note = data?.note ?? loadingNote;

	return (
		<div className="flex flex-col gap-3">
			<h1
				className="text-balance text-4xl font-extrabold leading-[0.95] tracking-[-0.03em] md:text-5xl xl:text-6xl"
				suppressHydrationWarning
			>
				{data?.headline ?? headline}
			</h1>
			<p
				key={note}
				className="prompt-cycle text-xl font-semibold leading-tight opacity-60 md:text-2xl"
			>
				{note}
			</p>
		</div>
	);
}
