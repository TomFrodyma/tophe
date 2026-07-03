import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import * as React from "react";

import { cn } from "../lib";

const alertVariants = cva(
	"relative w-full rounded-3xl border p-6 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:top-6 [&>svg]:left-6 [&>svg]:size-4 [&>svg~*]:pl-7",
	{
		variants: {
			variant: {
				default:
					"border-brand-ink/12 bg-brand-ink/4 text-brand-ink",
				primary:
					"border-brand-blue/25 bg-brand-blue/10 text-brand-blue [&>svg]:text-brand-blue",
				error:
					"border-brand-coral/25 bg-brand-coral/10 text-brand-coral [&>svg]:text-brand-coral",
				success:
					"border-brand-blue/25 bg-brand-blue/10 text-brand-blue [&>svg]:text-brand-blue",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

const Alert = ({
	className,
	variant,
	...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>) => (
	<div role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
);

const AlertTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
	// oxlint-disable-next-line jsx_a11y/heading-has-content
	<h5
		className={cn("font-semibold text-sm leading-tight tracking-tight", className)}
		{...props}
	/>
);

const AlertDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
	<div className={cn("text-sm [&_p]:leading-relaxed mt-1", className)} {...props} />
);

export { Alert, AlertDescription, AlertTitle };
