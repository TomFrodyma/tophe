"use client";

import { cn } from "@repo/ui";
import type { ReactNode } from "react";

/**
 * Editorial page header used across the SaaS app.
 *
 * Renders a serif italic-feel title (44px) with optional sub copy in serif
 * body, capped by the signature composite rule. Accepts an `actions` slot
 * (typically buttons) that sits on the right of the title block on wide
 * viewports and wraps below on narrow ones.
 */
export function PageHeader({
	title,
	subtitle,
	eyebrow,
	actions,
	className,
}: {
	title: string;
	subtitle?: string;
	/** Optional small wide-tracked label above the title. */
	eyebrow?: string;
	actions?: ReactNode;
	className?: string;
}) {
	return (
		<header className={cn("mb-8 flex flex-col gap-6 px-1.5 sm:mb-10", className)}>
			<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
				<div className="flex min-w-0 flex-col gap-3">
					{eyebrow && (
						<p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-60">
							{eyebrow}
						</p>
					)}
					<h1 className="text-balance text-4xl font-extrabold leading-[0.95] tracking-[-0.03em] sm:text-5xl lg:text-6xl">
						{title}
					</h1>
					{subtitle && (
						<p className="max-w-[60ch] text-base leading-relaxed text-pretty opacity-70 sm:text-lg">
							{subtitle}
						</p>
					)}
				</div>
				{actions && (
					<div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-3">
						{actions}
					</div>
				)}
			</div>
		</header>
	);
}
