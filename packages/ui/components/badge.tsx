import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import type React from "react";

import { cn } from "../lib";

export const badge = cva(
	[
		"inline-block",
		"rounded-pill",
		"px-3",
		"py-1",
		"text-[11px]",
		"uppercase",
		"font-semibold",
		"tracking-[0.12em]",
		"leading-tight",
	],
	{
		variants: {
			status: {
				success: ["bg-brand-blue/14", "text-brand-blue"],
				info: ["bg-brand-ink/10", "text-brand-ink"],
				warning: ["bg-brand-sand/22", "text-brand-sand"],
				error: ["bg-brand-coral/14", "text-brand-coral"],
			},
		},
		defaultVariants: {
			status: "info",
		},
	},
);

export type BadgeProps = React.HtmlHTMLAttributes<HTMLDivElement> & VariantProps<typeof badge>;

export const Badge = ({ children, className, status, ...props }: BadgeProps) => (
	<span className={cn(badge({ status }), className)} {...props}>
		{children}
	</span>
);

Badge.displayName = "Badge";
