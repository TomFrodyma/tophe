import { cn } from "@repo/ui";
import type { PropsWithChildren } from "react";

export function AuthWrapper({
	children,
	contentClass,
}: PropsWithChildren<{ contentClass?: string }>) {
	return (
		<div className="flex min-h-screen w-full items-center justify-center p-6">
			<main
				className={cn(
					"w-full max-w-md rounded-block border border-brand-ink/10 bg-paper-elev p-8 lg:p-10",
					contentClass,
				)}
			>
				{children}
			</main>
		</div>
	);
}
