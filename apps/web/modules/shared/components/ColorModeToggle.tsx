"use client";

import {
	Button,
	cn,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@repo/ui";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@repo/ui/components/tooltip";
import { CheckIcon, MonitorCogIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useIsClient } from "usehooks-ts";

const COLOR_MODE_OPTIONS = [
	{ value: "system", icon: MonitorCogIcon },
	{ value: "light", icon: SunIcon },
	{ value: "dark", icon: MoonIcon },
] as const;

interface ColorModeToggleProps {
	/** Render as a single icon button that opens a dropdown, rather than the
	 * expanded 3-icon segmented pill. Use in tight spaces like the sidebar. */
	compact?: boolean;
}

export function ColorModeToggle({ compact = false }: ColorModeToggleProps) {
	const { setTheme, theme } = useTheme();
	const [value, setValue] = useState<string>(theme ?? "system");
	const isClient = useIsClient();
	const t = useTranslations();

	useEffect(() => {
		if (theme) {
			setValue(theme);
		}
	}, [theme]);

	if (!isClient) {
		return null;
	}

	const handleClick = (optionValue: string) => {
		setTheme(optionValue);
		setValue(optionValue);
	};

	if (compact) {
		const currentOption =
			COLOR_MODE_OPTIONS.find((o) => o.value === value) ?? COLOR_MODE_OPTIONS[0];
		const CurrentIcon = currentOption.icon;
		const currentLabel = t(`common.colorMode.${currentOption.value}`);

		return (
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="icon"
						aria-label={`${currentLabel} mode`}
						data-test="color-mode-toggle"
					>
						<CurrentIcon className="size-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start" side="top">
					{COLOR_MODE_OPTIONS.map((option) => {
						const Icon = option.icon;
						const isActive = option.value === value;
						return (
							<DropdownMenuItem
								key={option.value}
								onSelect={() => handleClick(option.value)}
								className="cursor-pointer"
								data-test={`color-mode-toggle-item-${option.value}`}
							>
								<Icon className="size-4 mr-2" />
								<span>{t(`common.colorMode.${option.value}`)}</span>
								{isActive && (
									<CheckIcon className="size-3.5 ml-auto opacity-60" />
								)}
							</DropdownMenuItem>
						);
					})}
				</DropdownMenuContent>
			</DropdownMenu>
		);
	}

	const activeIndex = COLOR_MODE_OPTIONS.findIndex((option) => option.value === value);

	return (
		<TooltipProvider delayDuration={0}>
			<div
				className="gap-0 p-0.5 relative inline-flex items-center rounded-full bg-muted"
				data-test="color-mode-toggle"
			>
				{/* Active indicator */}
				<div
					className="left-0.5 top-0.5 h-7 w-7 shadow-sm ease-in-out absolute rounded-full border border-border bg-background transition-transform duration-200"
					style={{
						transform: `translateX(${activeIndex * 100}%)`,
					}}
					aria-hidden="true"
				/>

				{COLOR_MODE_OPTIONS.map((option) => {
					const Icon = option.icon;
					const isActive = option.value === value;
					const label = t(`common.colorMode.${option.value}`);

					return (
						<Tooltip key={option.value}>
							<TooltipTrigger asChild>
								<button
									type="button"
									onClick={() => handleClick(option.value)}
									className={cn(
										"h-7 w-7 relative z-10 flex items-center justify-center rounded-full transition-colors",
										"focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
										isActive
											? "text-foreground"
											: "text-muted-foreground hover:text-foreground",
									)}
									data-test={`color-mode-toggle-item-${option.value}`}
									aria-label={`${label} mode`}
									aria-pressed={isActive}
								>
									<Icon className="size-3.5" />
								</button>
							</TooltipTrigger>
							<TooltipContent>{label}</TooltipContent>
						</Tooltip>
					);
				})}
			</div>
		</TooltipProvider>
	);
}
