"use client";

import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { cn } from "@repo/ui";
import { GripVerticalIcon } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * Drag-sorting for one vertical list of rows (each row registers itself via
 * `useSortable` and renders a `DragHandle`). Every group is its own DndContext,
 * so an item can never be dropped into a neighboring group.
 */
export function SortableGroup({
	ids,
	onReorder,
	children,
}: {
	ids: string[];
	onReorder: (ids: string[]) => void;
	children: ReactNode;
}) {
	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
	);

	function handleDragEnd({ active, over }: DragEndEvent) {
		if (!over || active.id === over.id) return;
		onReorder(arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id))));
	}

	return (
		<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
			<SortableContext items={ids} strategy={verticalListSortingStrategy}>
				{children}
			</SortableContext>
		</DndContext>
	);
}

/** The grip a row exposes for dragging. Spread `useSortable`'s `attributes` and
 *  `listeners` onto it. touch-none so touch drags don't fight page scroll. */
export function DragHandle({
	label,
	className,
	...rest
}: { label: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
	return (
		<button
			type="button"
			aria-label={label}
			className={cn(
				"shrink-0 cursor-grab touch-none text-muted-foreground/50 hover:text-foreground active:cursor-grabbing",
				className,
			)}
			{...rest}
		>
			<GripVerticalIcon className="size-4" />
		</button>
	);
}
