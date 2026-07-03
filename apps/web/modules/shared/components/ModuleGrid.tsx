"use client";

import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	MouseSensor,
	TouchSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { arrayMove, rectSortingStrategy, SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@repo/ui";
import { usePersistentState } from "@shared/hooks/use-persistent-state";
import {
	BriefcaseIcon,
	CalendarDaysIcon,
	GiftIcon,
	ListChecksIcon,
	NewspaperIcon,
	NotebookPenIcon,
	StickyNoteIcon,
	TargetIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { ComponentType, MutableRefObject } from "react";
import { useRef } from "react";

type ModuleKey =
	| "journal"
	| "calendar"
	| "goals"
	| "tasks"
	| "notes"
	| "career"
	| "wishlist"
	| "briefing";

interface ModuleDef {
	key: ModuleKey;
	icon: ComponentType<{ className?: string; strokeWidth?: number | string }>;
	href: string;
}

/**
 * Responsive grid: 1 → 2 → 3 → 4 columns as the viewport grows, so cards stay
 * readable in a half-screen window instead of being crushed into four columns.
 *
 * Every module has its own hue from the `--module-*` tokens in
 * `tooling/tailwind/theme.css` - no repeats, so neighboring cards never share
 * a color regardless of how the columns wrap.
 *
 * Cards are drag-sortable (mouse drag, long-press on touch); the order persists
 * per device in localStorage.
 */
const MODULES: ModuleDef[] = [
	{ key: "journal", icon: NotebookPenIcon, href: "/journal" },
	{ key: "calendar", icon: CalendarDaysIcon, href: "/calendar" },
	{ key: "goals", icon: TargetIcon, href: "/goals" },
	{ key: "tasks", icon: ListChecksIcon, href: "/tasks" },
	{ key: "notes", icon: StickyNoteIcon, href: "/notes" },
	{ key: "career", icon: BriefcaseIcon, href: "/career" },
	{ key: "wishlist", icon: GiftIcon, href: "/wishlist" },
	{ key: "briefing", icon: NewspaperIcon, href: "/briefing" },
];

const MODULES_BY_KEY = Object.fromEntries(MODULES.map((m) => [m.key, m])) as Record<
	ModuleKey,
	ModuleDef
>;
const DEFAULT_ORDER = MODULES.map((m) => m.key);

// One tile color per module - hex values live in
// `tooling/tailwind/theme.css` (`--module-*`): the bright pop family in light
// mode (extended so no hue repeats), neutralized to one calm surface in dark
// mode. Tile text is `--module-ink` (white on the light tiles, cream on dark).
const TILE_COLOR_CLASSES: Record<ModuleKey, string> = {
	journal: "bg-module-journal",
	calendar: "bg-module-calendar",
	goals: "bg-module-goals",
	tasks: "bg-module-tasks",
	notes: "bg-module-notes",
	career: "bg-module-career",
	wishlist: "bg-module-wishlist",
	briefing: "bg-module-briefing",
};

const CARD_SIZE_CLASSES = "sm:min-h-[200px]";
const GRID_CLASSES = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-5";

export function ModuleGrid() {
	const t = useTranslations("start.modules");
	const [storedOrder, setStoredOrder] = usePersistentState<ModuleKey[]>(
		"tophe.start.moduleOrder",
		DEFAULT_ORDER,
	);
	// A stored order may predate newly added modules: keep the known keys in the
	// saved order and append anything new at the end.
	const order = [
		...storedOrder.filter((k) => MODULES_BY_KEY[k]),
		...DEFAULT_ORDER.filter((k) => !storedOrder.includes(k)),
	];

	// Distance/delay constraints keep plain clicks and touch scrolling working;
	// only a deliberate drag (8px with mouse, long-press on touch) starts a sort.
	const sensors = useSensors(
		useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
		useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
	);

	// After a drop the browser still fires a click on the card, which would
	// navigate. Flag drags and swallow that one click.
	const draggedRef = useRef(false);
	const clearDragged = () => setTimeout(() => (draggedRef.current = false), 0);

	function handleDragEnd({ active, over }: DragEndEvent) {
		clearDragged();
		if (!over || active.id === over.id) return;
		setStoredOrder(
			arrayMove(
				order,
				order.indexOf(active.id as ModuleKey),
				order.indexOf(over.id as ModuleKey),
			),
		);
	}

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragStart={() => (draggedRef.current = true)}
			onDragEnd={handleDragEnd}
			onDragCancel={clearDragged}
		>
			<SortableContext items={order} strategy={rectSortingStrategy}>
				<div className={GRID_CLASSES}>
					{order.map((key, i) => (
						<ModuleCard
							key={key}
							mod={MODULES_BY_KEY[key]}
							index={i}
							t={t}
							draggedRef={draggedRef}
						/>
					))}
				</div>
			</SortableContext>
		</DndContext>
	);
}

function ModuleCard({
	mod,
	index,
	t,
	draggedRef,
}: {
	mod: ModuleDef;
	index: number;
	t: ReturnType<typeof useTranslations>;
	draggedRef: MutableRefObject<boolean>;
}) {
	// listeners only, not attributes: the sortable aria attributes would turn the
	// link into a button and hijack Enter, breaking keyboard navigation.
	const { listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: mod.key,
	});

	return (
		<Link
			ref={setNodeRef}
			href={mod.href}
			style={{
				transform: CSS.Transform.toString(transform),
				transition,
				zIndex: isDragging ? 10 : undefined,
			}}
			onClick={(e) => {
				if (draggedRef.current) e.preventDefault();
			}}
			className={cn(
				"touch-manipulation rounded-block focus-visible:ring-4 focus-visible:ring-brand-ink/30 focus-visible:outline-none",
				CARD_SIZE_CLASSES,
				isDragging && "opacity-70",
			)}
			{...listeners}
		>
			<article
				className={cn(
					"group p-6 xl:p-8 flex h-full w-full flex-col justify-between rounded-block text-module-ink transition-[filter] duration-200 hover:brightness-[0.96]",
					TILE_COLOR_CLASSES[mod.key],
				)}
			>
				<div className="gap-3 flex items-start justify-between">
					<p className="text-xs font-semibold tracking-[0.18em] uppercase opacity-70">
						/ {(index + 1).toString().padStart(2, "0")}
					</p>
					<mod.icon className="size-6 shrink-0" strokeWidth={1.75} />
				</div>

				<div className="gap-3 flex flex-col">
					<h3 className="text-3xl font-extrabold md:text-4xl min-h-[2lh] leading-[0.92] tracking-[-0.03em]">
						{t(`${mod.key}.title`)}
					</h3>
					<p className="text-sm leading-relaxed line-clamp-3 min-h-[4.5rem] max-w-[34ch] opacity-80">
						{t(`${mod.key}.description`)}
					</p>
				</div>
			</article>
		</Link>
	);
}
