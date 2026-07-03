import React from "react";

import { cn } from "../lib";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = ({ className, type, ...props }: InputProps) => {
	return (
		<input
			type={type}
			className={cn(
				"flex h-11 w-full rounded-pill border border-brand-ink/20 bg-transparent px-5 py-1 text-base text-brand-ink transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-brand-ink/45 focus-visible:border-brand-ink focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-ink/20 disabled:cursor-not-allowed disabled:opacity-50",
				className,
			)}
			{...props}
		/>
	);
};

export { Input };
