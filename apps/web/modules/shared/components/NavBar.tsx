"use client";

import { AgentNavIcon } from "@ai/components/AgentIcon";
import { useAgentName } from "@ai/hooks/use-agent-name";
import { useSession } from "@auth/hooks/use-session";
import { config as saasConfig } from "@config";
import {
	Button,
	cn,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
	TopheMark,
} from "@repo/ui";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@repo/ui/components/tooltip";
import { ColorModeToggle } from "@shared/components/ColorModeToggle";
import { NotificationCenter } from "@shared/components/NotificationCenter";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import {
	BookOpenIcon,
	BriefcaseIcon,
	CalendarDaysIcon,
	ChevronDownIcon,
	GiftIcon,
	HomeIcon,
	ListChecksIcon,
	MenuIcon,
	NewspaperIcon,
	PanelLeftCloseIcon,
	PanelLeftOpenIcon,
	StickyNoteIcon,
	TargetIcon,
	UserCogIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

import { useIsMobile } from "../hooks/use-media-query";
import { useSidebar } from "../lib/sidebar-context";

type ModuleId = "chatbot" | "journal" | "goals" | "tasks" | "notes" | "career" | "wishlist";

interface ModuleDef {
	id: ModuleId;
	labelKey: string;
	href: string;
	icon: React.ComponentType<{ className?: string }>;
}

const MODULE_DEFS: ModuleDef[] = [
	{ id: "chatbot", labelKey: "app.menu.aiChatbot", href: "/chatbot", icon: AgentNavIcon },
	{ id: "journal", labelKey: "app.menu.journal", href: "/journal", icon: BookOpenIcon },
	{ id: "goals", labelKey: "app.menu.goals", href: "/goals", icon: TargetIcon },
	{ id: "tasks", labelKey: "app.menu.tasks", href: "/tasks", icon: ListChecksIcon },
	{ id: "notes", labelKey: "app.menu.notes", href: "/notes", icon: StickyNoteIcon },
	{
		id: "career",
		labelKey: "app.menu.career",
		href: "/career",
		icon: BriefcaseIcon,
	},
	{
		id: "wishlist",
		labelKey: "app.menu.wishlist",
		href: "/wishlist",
		icon: GiftIcon,
	},
];

function isModuleId(value: string): value is ModuleId {
	return MODULE_DEFS.some((m) => m.id === value);
}

interface NavSubItem {
	label: string;
	href: string;
}

interface NavMenuItem {
	label: string;
	href: string;
	icon: React.ComponentType<{ className?: string }>;
	isActive: boolean;
	subItems?: NavSubItem[];
}

interface NavMenuListProps {
	menuItems: NavMenuItem[];
	isCollapsedEffective: boolean;
	listClassName?: string;
	onLinkClick?: () => void;
	openParents: Record<string, boolean>;
	onToggleParent: (key: string, currentlyOpen: boolean) => void;
}

function isNavSubItemActive(pathname: string, href: string): boolean {
	return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * A parent's open/closed state defaults to whether the user is on one of
 * its sub-routes. Once they toggle it manually, the explicit choice wins.
 */
function isParentOpen(menuItem: NavMenuItem, openParents: Record<string, boolean>): boolean {
	const explicit = openParents[menuItem.label];
	return explicit !== undefined ? explicit : menuItem.isActive;
}

function NavMenuList({
	menuItems,
	isCollapsedEffective,
	listClassName,
	onLinkClick,
	openParents,
	onToggleParent,
}: NavMenuListProps) {
	const pathname = usePathname();

	return (
		<TooltipProvider delayDuration={0}>
			<ul className={listClassName}>
				{menuItems.map((menuItem) => {
					const parentClasses = cn(
						"gap-3 px-4 py-2.5 text-sm flex w-full items-center rounded-pill whitespace-nowrap transition-[background-color,color] duration-150",
						{
							"font-semibold bg-brand-ink text-brand-bg": menuItem.isActive,
							"text-brand-ink/70 hover:bg-brand-ink/8 hover:text-brand-ink":
								!menuItem.isActive,
							"md:justify-center md:px-2": isCollapsedEffective,
						},
					);

					// Heavier stroke so the lucide outlines sit next to the solid brand mark without looking wispy.
					const parentIcon = (
						<menuItem.icon className="size-5 shrink-0 [stroke-width:2.75]" />
					);

					if (menuItem.subItems?.length) {
						if (isCollapsedEffective) {
							if (!menuItem.isActive) {
								return (
									<li key={menuItem.href}>
										<Tooltip>
											<TooltipTrigger asChild>
												<Link
													href={menuItem.href}
													onClick={onLinkClick}
													className={parentClasses}
													prefetch
												>
													{parentIcon}
												</Link>
											</TooltipTrigger>
											<TooltipContent side="right">
												{menuItem.label}
											</TooltipContent>
										</Tooltip>
									</li>
								);
							}

							return (
								<li key={menuItem.href} className="w-full">
									<DropdownMenu>
										<Tooltip>
											<TooltipTrigger asChild>
												<DropdownMenuTrigger asChild>
													<button
														type="button"
														className={parentClasses}
														aria-label={menuItem.label}
													>
														{parentIcon}
													</button>
												</DropdownMenuTrigger>
											</TooltipTrigger>
											<TooltipContent side="right">
												{menuItem.label}
											</TooltipContent>
										</Tooltip>
										<DropdownMenuContent
											side="right"
											align="start"
											sideOffset={8}
										>
											<DropdownMenuLabel className="font-normal text-muted-foreground">
												{menuItem.label}
											</DropdownMenuLabel>
											{menuItem.subItems.map((subItem) => {
												const subActive = isNavSubItemActive(
													pathname,
													subItem.href,
												);
												return (
													<DropdownMenuItem key={subItem.href} asChild>
														<Link
															href={subItem.href}
															className={cn(
																"flex w-full cursor-pointer items-center",
																subActive && "font-semibold",
															)}
														>
															{subItem.label}
														</Link>
													</DropdownMenuItem>
												);
											})}
										</DropdownMenuContent>
									</DropdownMenu>
								</li>
							);
						}

						const open = isParentOpen(menuItem, openParents);

						return (
							<li key={menuItem.href} className="gap-0.5 flex flex-col">
								<button
									type="button"
									onClick={() => onToggleParent(menuItem.label, open)}
									aria-expanded={open}
									className={parentClasses}
								>
									{parentIcon}
									<span className="flex-1 text-left">{menuItem.label}</span>
									<ChevronDownIcon
										className={cn(
											"size-3.5 shrink-0 text-muted-foreground/60 transition-transform",
											!open && "-rotate-90",
										)}
										aria-hidden
									/>
								</button>
								{open && (
									<div className="mt-1 relative">
										{/* Vertical guide: aligned with parent icon center; starts below parent row (no overlap with icon) */}
										<div
											className="top-0 bottom-0 left-5.5 absolute w-px -translate-x-1/2 bg-border/60"
											aria-hidden
										/>
										<ul className="gap-0.5 pl-9 flex flex-col">
											{menuItem.subItems.map((subItem) => {
												const subActive = isNavSubItemActive(
													pathname,
													subItem.href,
												);
												return (
													<li key={subItem.href}>
														<Link
															href={subItem.href}
															onClick={onLinkClick}
															className={cn(
																"min-w-0 px-3 py-1.5 text-sm flex flex-1 items-center rounded-pill transition-colors",
																subActive
																	? "font-semibold bg-brand-ink/12 text-brand-ink"
																	: "text-brand-ink/60 hover:bg-brand-ink/8 hover:text-brand-ink",
															)}
															prefetch
														>
															<span className="truncate">
																{subItem.label}
															</span>
														</Link>
													</li>
												);
											})}
										</ul>
									</div>
								)}
							</li>
						);
					}

					const menuItemContent = (
						<Link
							href={menuItem.href}
							onClick={onLinkClick}
							className={parentClasses}
							prefetch
						>
							{parentIcon}
							{!isCollapsedEffective && (
								<span className="truncate">{menuItem.label}</span>
							)}
						</Link>
					);

					if (isCollapsedEffective) {
						return (
							<li key={menuItem.href}>
								<Tooltip>
									<TooltipTrigger asChild>{menuItemContent}</TooltipTrigger>
									<TooltipContent side="right">{menuItem.label}</TooltipContent>
								</Tooltip>
							</li>
						);
					}

					return <li key={menuItem.href}>{menuItemContent}</li>;
				})}
			</ul>
		</TooltipProvider>
	);
}

export function NavBar() {
	const t = useTranslations();
	const agentName = useAgentName();
	const pathname = usePathname();
	const { user } = useSession();
	const { isCollapsed, toggleCollapsed } = useSidebar();
	const isMobile = useIsMobile();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [openParents, setOpenParents] = useState<Record<string, boolean>>({});

	// Never use collapsed style on mobile - always show expanded
	const isCollapsedEffective = isCollapsed && !isMobile;

	const pinnedQuery = useQuery(orpc.users.getPinnedModules.queryOptions());
	const pinnedModules = useMemo<ModuleId[]>(() => {
		const ids = pinnedQuery.data?.pinnedModules ?? [];
		return ids.filter(isModuleId);
	}, [pinnedQuery.data]);

	const handleToggleParent = (key: string, currentlyOpen: boolean) => {
		setOpenParents((prev) => ({ ...prev, [key]: !currentlyOpen }));
	};


	const menuItems: NavMenuItem[] = useMemo(() => {
		// Empty means "show all", so the sidebar is never left without modules.
		// Which modules appear is chosen in Settings > Sidebar.
		const visibleDefs = pinnedModules.length
			? pinnedModules
					.map((id) => MODULE_DEFS.find((m) => m.id === id))
					.filter((m): m is ModuleDef => m !== undefined)
			: MODULE_DEFS;

		const moduleTopLevel: NavMenuItem[] = visibleDefs.map((m) => ({
			// The chatbot entry carries the user-chosen agent name, not an i18n label.
			label: m.id === "chatbot" ? agentName : t(m.labelKey),
			href: m.href,
			icon: m.icon,
			isActive: isNavSubItemActive(pathname, m.href),
		}));

		return [
			{
				label: t("app.menu.start"),
				href: "/",
				icon: HomeIcon,
				isActive: pathname === "/",
			},
			{
				label: t("app.menu.briefing"),
				href: "/briefing",
				icon: NewspaperIcon,
				isActive: pathname === "/briefing" || pathname.startsWith("/briefing/"),
			},
			{
				label: t("app.menu.calendar"),
				href: "/calendar",
				icon: CalendarDaysIcon,
				isActive: pathname === "/calendar" || pathname.startsWith("/calendar/"),
			},
			...moduleTopLevel,

			{
				label: t("app.menu.accountSettings"),
				href: "/settings/general",
				icon: UserCogIcon,
				isActive: pathname.startsWith("/settings/"),
			},
		];
	}, [agentName, pathname, pinnedModules, t]);

	return (
		<nav
			className={cn(
				"md:fixed md:top-0 md:left-0 md:h-full md:w-[260px] md:border-r md:border-brand-ink/10 md:bg-paper-sunk w-full",
				isCollapsedEffective && "md:w-[76px]",
			)}
		>
			<div className="max-w-6xl py-4 md:min-h-0 md:flex md:h-full md:flex-col md:px-4 md:py-0 container">
				<div className="gap-6 md:h-16 md:shrink-0 flex flex-wrap items-center justify-between">
					<div
						className={cn(
							"gap-1.5 md:flex md:w-full md:flex-col md:items-stretch md:align-stretch flex items-center",
							isCollapsedEffective ? "md:gap-2" : "md:gap-3",
						)}
					>
						<div
							className={cn(
								"gap-4 md:w-full flex items-center",
								isCollapsedEffective
									? "md:flex-col md:items-center md:justify-center md:gap-2"
									: "md:relative md:flex-row md:justify-center justify-center",
							)}
						>
							<div className="gap-2 flex shrink-0 items-center justify-center">
								<Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
									<SheetTrigger asChild>
										<Button
											variant="ghost"
											size="icon"
											className="md:hidden -ml-1.5 mr-1.5 shrink-0"
											aria-label={t("app.menu.openNavigation")}
											type="button"
										>
											<MenuIcon className="size-5" />
										</Button>
									</SheetTrigger>
									<SheetContent
										side="left"
										className="p-0 pt-14 sm:max-w-[280px] flex h-full w-[min(100vw,280px)] flex-col overflow-hidden border-r"
									>
										<SheetHeader className="sr-only">
											<SheetTitle>{t("app.menu.navigationTitle")}</SheetTitle>
										</SheetHeader>
										<div className="min-h-0 px-4 pb-4 flex flex-1 flex-col">
											<div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]">
												<div className="brand-wordmark mb-4 px-2 flex items-center gap-2">
													{(user as { showBrandLogo?: boolean } | null)
														?.showBrandLogo !== false && (
														<TopheMark className="size-7" />
													)}
													{saasConfig.appName.toLowerCase()}
												</div>
												<NavMenuList
													menuItems={menuItems}
													isCollapsedEffective={false}
													listClassName="flex list-none flex-col flex-nowrap items-stretch gap-1 px-0"
													onLinkClick={() => setMobileMenuOpen(false)}
													openParents={openParents}
													onToggleParent={handleToggleParent}
												/>
											</div>
										</div>
									</SheetContent>
								</Sheet>
							</div>
						</div>
					</div>

					<div className="mr-0 gap-2 md:hidden ml-auto flex items-center justify-end">
						<NotificationCenter className="shrink-0" />
						<ColorModeToggle />
					</div>
				</div>

				<div className="min-h-0 md:flex md:justify-center hidden flex-1 flex-col overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]">
					<NavMenuList
						menuItems={menuItems}
						isCollapsedEffective={isCollapsedEffective}
						listClassName={cn(
							"md:mx-0 md:flex md:flex-col md:flex-nowrap md:items-stretch md:gap-1 md:px-0 md:overflow-visible hidden list-none",
							isCollapsedEffective && "md:items-center",
						)}
						openParents={openParents}
						onToggleParent={handleToggleParent}
					/>
				</div>

				<div
					className={cn(
						"pb-4 md:mt-auto md:flex md:w-full md:shrink-0 md:items-center hidden",
						isCollapsedEffective
							? "md:flex-col md:gap-2"
							: "md:flex-row md:justify-between",
					)}
				>
					<ColorModeToggle compact />
					<NotificationCenter className="shrink-0" side="top" align="center" />
					<Button
						variant="ghost"
						size="icon"
						onClick={toggleCollapsed}
						aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
					>
						{isCollapsed ? (
							<PanelLeftOpenIcon className="size-4 opacity-40!" />
						) : (
							<PanelLeftCloseIcon className="size-4 opacity-40!" />
						)}
					</Button>
				</div>
			</div>
		</nav>
	);
}
