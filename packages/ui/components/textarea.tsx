import * as React from "react";

import { cn } from "../lib";

const Textarea = ({ className, ...props }: React.ComponentProps<"textarea">) => {
	return (
		<textarea
			className={cn(
				"flex min-h-[96px] w-full rounded-3xl border border-brand-ink/20 bg-transparent px-5 py-3 text-base text-brand-ink placeholder:text-brand-ink/45 focus-visible:border-brand-ink focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-ink/20 disabled:cursor-not-allowed disabled:opacity-50",
				className,
			)}
			{...props}
		/>
	);
};

export { Textarea };
