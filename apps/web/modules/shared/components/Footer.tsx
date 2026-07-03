import { cn } from "@repo/ui";

export function Footer() {
	return (
		<footer className={cn("max-w-6xl py-6 text-xs container text-center text-foreground/50")}>
			<span>© {new Date().getFullYear()} TOPHE</span>
		</footer>
	);
}
