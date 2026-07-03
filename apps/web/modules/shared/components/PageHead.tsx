import { cn } from "@repo/ui";
import type { ReactNode } from "react";

interface PageHeadProps {
	/** Tiny mono uppercase line above the title - typically "WORKSPACE / SECTION". */
	eyebrow?: ReactNode;
	/** Main editorial heading rendered in serif italic-feel weight 500. */
	title: ReactNode;
	/** Optional supporting copy in serif body, ink-soft. */
	sub?: ReactNode;
	/** Right-aligned action cluster (buttons, etc.). */
	actions?: ReactNode;
	className?: string;
}

/**
 * Page heading used across the SaaS app - the visual signature of the
 * paper-and-ink redesign. Composes an eyebrow, a serif title, a serif
 * sub, and an actions slot, ending in a composite rule:
 *
 *   ─────────────────  (accent-strong 0–24%, gap, then rule 28–100%)
 */
export function PageHead({ eyebrow, title, sub, actions, className }: PageHeadProps) {
	return (
		<header className={cn("mb-8 flex flex-col gap-6 px-1.5", className)}>
			<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
				<div className="flex min-w-0 flex-col gap-3">
					{eyebrow && (
						<span className="text-xs font-semibold uppercase tracking-[0.18em] opacity-60">
							{eyebrow}
						</span>
					)}
					<h1 className="text-balance text-4xl font-extrabold leading-[0.95] tracking-[-0.03em] sm:text-5xl lg:text-6xl">
						{title}
					</h1>
					{sub && (
						<p className="max-w-[60ch] text-base leading-relaxed text-pretty opacity-70 sm:text-lg">
							{sub}
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
