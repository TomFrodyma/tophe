import * as React from "react";

import { cn } from "../lib";

const Card = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		className={cn(
			"rounded-block border border-brand-ink/10 bg-brand-bg text-brand-ink dark:bg-paper-elev",
			className,
		)}
		{...props}
	/>
);

const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
	<div className={cn("flex flex-col gap-2 p-10 pb-6", className)} {...props} />
);

const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
	// oxlint-disable-next-line jsx_a11y/heading-has-content
	<h3
		className={cn(
			"text-2xl font-extrabold leading-tight tracking-[-0.02em]",
			className,
		)}
		{...props}
	/>
);

const CardDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
	<p className={cn("text-sm leading-relaxed opacity-70", className)} {...props} />
);

const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
	<div className={cn("p-10 pt-0", className)} {...props} />
);

const CardFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
	<div className={cn("flex items-center p-10 pt-0", className)} {...props} />
);

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
