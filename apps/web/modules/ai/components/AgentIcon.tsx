"use client";

import { useSession } from "@auth/hooks/use-session";
import { cn, TopheMark, TopheMarkMono } from "@repo/ui";
import { CircleUserRound } from "lucide-react";

interface AgentIconProps {
	className?: string;
	/** Accessible label; pass "" for a purely decorative icon. */
	title?: string;
}

/** The brand-logo preference from the session; defaults to on. */
function useBrandLogo(): boolean {
	const { user } = useSession();
	return (user as { showBrandLogo?: boolean } | null)?.showBrandLogo !== false;
}

export function AgentIcon({ className, title = "" }: AgentIconProps) {
	const brand = useBrandLogo();

	if (brand) {
		return (
			<TopheMark
				className={cn("inline-block", className)}
				role={title ? "img" : undefined}
				aria-label={title || undefined}
			/>
		);
	}

	return (
		<CircleUserRound
			className={cn("inline-block", className)}
			role={title ? "img" : undefined}
			aria-label={title || undefined}
			aria-hidden={title ? undefined : true}
		/>
	);
}

// Nav variant: same glyph, strokes in currentColor like the lucide icons beside it.
export function AgentNavIcon({ className, title = "" }: AgentIconProps) {
	const brand = useBrandLogo();

	if (brand) {
		return (
			<TopheMarkMono
				className={className}
				role={title ? "img" : "presentation"}
				aria-label={title || undefined}
			/>
		);
	}

	return (
		<CircleUserRound
			className={className}
			role={title ? "img" : "presentation"}
			aria-label={title || undefined}
			aria-hidden={title ? undefined : true}
		/>
	);
}
