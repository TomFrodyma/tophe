import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { Slot as SlotPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "../lib";
import { Spinner } from "./spinner";

const buttonVariants = cva(
	"flex items-center justify-center font-semibold enabled:cursor-pointer transition-[filter,background-color,color] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&>svg]:mr-1.5 [&>svg+svg]:hidden",
	{
		variants: {
			variant: {
				primary: "bg-brand-ink text-brand-bg hover:brightness-[1.15]",
				secondary:
					"bg-brand-ink/8 text-brand-ink hover:bg-brand-ink/14",
				outline:
					"border border-brand-ink/20 bg-transparent text-brand-ink hover:bg-brand-ink/5",
				ghost: "text-brand-ink hover:bg-brand-ink/8",
				destructive: "bg-brand-coral text-white hover:brightness-95",
				link: "text-brand-ink underline-offset-4 hover:underline",
			},
			size: {
				sm: "h-8 rounded-pill px-4 text-xs",
				md: "h-10 rounded-pill px-6 text-sm",
				lg: "h-12 rounded-pill px-8 text-base",
				icon: "size-9 rounded-pill [&>svg]:m-0",
			},
		},
		defaultVariants: {
			variant: "secondary",
			size: "md",
		},
	},
);

export type ButtonProps = {
	asChild?: boolean;
	loading?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement> &
	VariantProps<typeof buttonVariants>;

const Button = ({
	className,
	children,
	variant,
	size,
	asChild = false,
	loading,
	disabled,
	...props
}: ButtonProps) => {
	const Comp = asChild ? SlotPrimitive.Slot : "button";
	return (
		<Comp
			className={cn(buttonVariants({ variant, size, className }))}
			disabled={disabled || loading}
			{...props}
		>
			{loading && <Spinner className="mr-1.5 size-4 text-inherit" />}
			<SlotPrimitive.Slottable>{children}</SlotPrimitive.Slottable>
		</Comp>
	);
};

export { Button, buttonVariants };
