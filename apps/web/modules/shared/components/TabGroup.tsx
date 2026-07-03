"use client";

import { cn } from "@repo/ui";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { useMemo } from "react";

export function TabGroup({
	items,
	className,
}: {
	items: { label: string; href: string; segment: string }[];
	className?: string;
}) {
	const selectedSegment = useSelectedLayoutSegment();
	const activeItem = useMemo(() => {
		return items.find((item) => item.segment === selectedSegment);
	}, [items, selectedSegment]);

	return (
		<div className={cn("flex flex-wrap gap-2", className)}>
			{items.map((item) => (
				<Link
					key={item.href}
					href={item.href}
					className={cn(
						"rounded-pill px-5 py-2 text-sm font-semibold transition-colors",
						item === activeItem
							? "bg-brand-ink text-brand-bg"
							: "text-brand-ink/70 hover:bg-brand-ink/10 hover:text-brand-ink",
					)}
				>
					{item.label}
				</Link>
			))}
		</div>
	);
}
